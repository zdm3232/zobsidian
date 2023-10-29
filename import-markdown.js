
import './markdown-it.min.js';
var markDown = markdownit();

const blocks = {
  none: 0,
  heading: 1,
  paragraph: 2,
  table: 3,
  td: 4,
  link: 5,
  strong: 6,
  em: 7
};

class ruleBase {
  constructor( name, env, block ) {
    this.name = name;
    this.prevBlock = env.block;
    this.block = block;
    env.block = block;
    this.content = "";
    this.text = "";
    this.title = null;
    // console.log( `-> [${env.rules.length}] ${this.name}_open` );
  }
  addContent( txt ) { this.content += txt; }
  addText( txt ) { this.text += txt; }
  close( env, block ) {
    if ( block != this.block ) {
      console.warn( `ERROR: close ${block} != ${this.block}` );
    }
    env.rules.pop();
    // console.log( `-> [${env.rules.length}] ${this.name}_close : ${this.content}` );
    env.block = this.prevBlock;
    env.rules[ env.rules.length-1 ].addContent( this.content );
    env.rules[ env.rules.length-1 ].addText( this.text );
  }
};

class ruleRoot extends ruleBase {
  constructor( env ) {
    super( "root", env, blocks.none );
  }
};

class ruleHeading extends ruleBase {
  constructor( env, token ) {
    super( "heading", env, blocks.heading );
    this.tag = token.tag;
  }
  close( env, block ) {
    this.content = "";
    this.text = "";
    super.close( env, block );
  }
};

var env = {
  defaultRender: {
    text: markDown.renderer.rules.text,
    softbreak: markDown.renderer.rules.softbreak,
    hardbreak: markDown.renderer.rules.hardbreak,
  },
  block: blocks.none,
  db: [],
};

function initMarkdown() {
  markDown.renderer.rules.text = function( tokens, idx, options, env, self )
  {
    let token = tokens[idx];
    // fix odd dash
    token.content = token.content.replace( /−/g, "-" );

    env.rules[ env.rules.length-1 ].addContent( token.content );
    env.rules[ env.rules.length-1 ].addText( token.content );

    let def = env.defaultRender.text( tokens, idx, options, env, self );
    return def;
  }

  markDown.renderer.rules.heading_open = function( tokens, idx, options, env, self ) {
    env.rules.push( new ruleHeading( env, tokens[idx] ) );
    let m = tokens[idx].tag.match( /h(\d)/ );
    let level = parseInt( m[1] ) - 1;
    return `ZSPLITHERE\n\n<h${level}>`;
  }
  markDown.renderer.rules.heading_close = function( tokens, idx, options, env, self ) {
    env.rules[ env.rules.length-1 ].close( env, blocks.heading );
    let m = tokens[idx].tag.match( /h(\d)/ );
    let level = parseInt( m[1] ) - 1;
    return `</h${level}>`;
  }  
}

function unInitMarkdown()
{
  markDown.renderer.rules.text = env.defaultRender.text;

  markDown.renderer.rules.heading_open = undefined;
  markDown.renderer.rules.heading_close = undefined;
}

function createId( name ) {
  let input = name;
  let rtn = name.slugify( name, { strict: true } );
  rtn = rtn.replace( /[\']/g, "" );
  return rtn;
}

async function addPage( form, journal, html ) {
  let header = html.match( /<h(\d)>(.*)<\/h\d>/ );
  if ( header === null ) {
    return;
  }
  let level = parseInt( header[1] );
  let title = header[2];

  let room = false;

  if ( title.match( /^[A-Z]?\d+/ ) ) {
    form.message( `&nbsp;&nbsp;create room: ${title} ${level}` );
    // room = true;
    if ( level > 2 ) {
      // need to be at most level 2 for foundry to make notes
      html = html.replace( header[0], `<h2>${title}</h2>\n` );
    }
  }

  if ( journal.newpages.length && !room && level > 1 ) {
    let pid = journal.newpages[journal.newpages.length-1]._id;
    let cid = createId( title );
    form.journals[ `#${title}` ] = {
      name: `#${title}`,
      uuid: `.${pid}#${cid}`
    };
    form.journals[ `${journal.path}#${title}` ] = {
      name: `#${title}`,
      uuid: `${journal.uuid}.JournalEntryPage.${pid}#${cid}`
    };
    journal.newpages[ journal.newpages.length-1 ].text.content += `\n${html}`;
    return;
  }

  if ( level === 0 ) {
    html = html.replace( /<h0>.*<\/h0>/, "" );
  }

  let id = null;
  let existPage = journal.pages[ title ];
  if ( existPage ) {
    id = existPage.id;
  } else {
    form.message( `&nbsp;&nbsp;new page ${title}` );
    id = foundry.utils.randomID();
    journal.pages[ title ] = {
      name: title,
      id: id
    };
  }

  let page = {
    name: title,
    type: "text",
    _id: id,
    title: {
      show: false,
      level: level
    },
    image: {},
    text: {
      format: 1,
      content: html
    }
  };

  let pid = page._id;
  let cid = createId( title );
  form.journals[ `#${title}` ] = {
    name: `#${title}`,
    uuid: `.${pid}#${cid}`
  };
  form.journals[ `${journal.path}#${title}` ] = {
    name: `#${title}`,
    uuid: `${journal.uuid}.JournalEntryPage.${pid}#${cid}`
  };
  journal.newpages.push( page );
}

function imageLink( form, img )
{
  let newimg = form.images[img];
  if ( !newimg ) {
    form.message( `<font color="red">ERROR: missing image ${img}</font>` );
    return undefined;
  }
  return `<img src="${newimg}" />`;
}

function compendiumLink( form, link )
{
  let inp = link.replace( /^\[\[/, "" ).replace( /\]\]$/, "" ).split( /\|/ );
  let str = inp[0].replace( /^\//, "" ).split( /\// );
  if ( str.length < 2 ) {
    return undefined;
  }
  let links = form.links.compendiums[ str[0] ];
  if ( !links ) {
    return undefined;
  }
  let item = links.byid.get( str[1] );
  if ( !item ) {
    let fmatches = str[1].match( /(.*)-(\d+)$/ );
    if ( fmatches ) {
      item = links.byid.get( `${fmatches[2]}-${fmatches[1]}` );
    }
  }
  if ( !item ) {
    item = links.byname.get( str[1] );
  }
  if ( item ) {
    let title = (inp.length > 1) ? inp[1] : item.name;
    return `@UUID[${item.uuid}]{${title}}`;
  }
  return undefined;
}

function journalLink( form, link )
{
  let str = link.replace( /^\[\[/, "" ).replace( /\]\]$/, "" ).split( /\|/ );
  let journal = form.journals[ str[0] ];
  if ( !journal ) {
    form.message( `<font color="red">ERROR: missing link ${str[0]}</font>` );
    return undefined;
  }
  let title = "";
  if ( str.length > 1 ) {
    title = str[1];
  } else {
    title = journal.name;
  }
  return `@UUID[${journal.uuid}]{${title}}`;
}

async function correctLinks( form, journal )
{
  for ( let page of journal.newpages ) {
    let html = page.text.content;

    let matches = html.match( /\<img src=[^\>]+\>/g );
    if ( matches ) {
      for ( let link of matches ) {
	let ll = link.split( /\"/ );
	let str = ll[1];
	let newlink = imageLink( form, str );
	if ( newlink ) {
	  html = html.replace( link, newlink );
	}
      }
    }

    matches = html.match( /\!\[\[[^\]]+\]\]/g );
    if ( matches ) {
      for ( let link of matches ) {
	let str = link.replace( /^\!\[\[/, "" ).replace( /\]\]$/, "" );
	let newlink = imageLink( form, str );
	if ( newlink ) {
	  html = html.replace( link, newlink );
	}
      }
    }

    matches = html.match( /\[\[[^\]]+\]\]/g );
    if ( matches ) {
      for ( let link of matches ) {
	let replink = null;
	let newlink = compendiumLink( form, link );
	if ( !newlink ) {
	  newlink = journalLink( form, link );
	}
	if ( newlink ) {
	  html = html.replace( link, newlink );
	}
      }
    }
    page.text.content = html;
  }
}

function getPath( file ) {
  return file.webkitRelativePath.replace( /\.[^\.]+$/, "" );
}

async function createJournal( form, file, html ) {
  let htmlSplit = html.split( "ZSPLITHERE\n\n" );

  let path = getPath( file );
  let journal = form.journals[ path ];
  journal.update = true;
  for ( let pageHtml of htmlSplit ) {
    await addPage( form, journal, pageHtml );
  }

  await correctLinks( form, journal );
}

async function importMarkdownFile( form, file ) {
  form.message( `reading markdown ${file.webkitRelativePath}` );
  let data = await file.text();

  initMarkdown();

  env.form = form;
  env.block = blocks.none;
  env.rules = [];
  env.page = "";

  env.rules.push( new ruleRoot( env ) );

  let html = await markDown.render( data, env );

  await createJournal( form, file, html );

  unInitMarkdown();
}

export async function importMarkdown( form, files ) {
  form.message( '<br><h3>Importing Markdown</h3><hr>' );
  for ( let file of files ) {
    await importMarkdownFile( form, file );
  }

  // write all journals
  form.message( '<br><h3>Updating Journals</h3><hr>' );
  for ( let key of Object.keys(form.journals) ) {
    let jdata = form.journals[key];
    if ( !jdata.update ) {
      continue;
    }
    form.message( `db update ${jdata.path}` );
    let journal = await fromUuid( jdata.uuid );
    await journal.deleteEmbeddedDocuments( "JournalEntryPage", [], {deleteAll: true} );
    await journal.createEmbeddedDocuments( "JournalEntryPage", jdata.newpages, {keepId: true} );
  }
}

