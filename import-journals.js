

export class JournalCreate {

  getFolder( form, folders, file ) {
    let path = file.webkitRelativePath.replace( /\/[^\/]+$/, "" );
    let folder = folders[ path ];
    if ( !folder ) {
      folder = form.folder;
    }
    return folder;
  }

  getName( file ) {
    return file.name.replace( /\.[^\.]+$/, "" );
  }

  getPath( file ) {
    return file.webkitRelativePath.replace( /\.[^\.]+$/, "" );
  }

  async createJournals( form, folders, files ) {
    let journals = {};
    for ( let file of files ) {
      let folder = this.getFolder( form, folders, file );
      let title = this.getName( file );
      let journal = folder.contents.find( e => e.name === title );
      if ( journal ) {
	form.message( `found journal ${file.webkitRelativePath}` );
      } else {
	form.message( `create journal ${file.webkitRelativePath}` );
	journal = await JournalEntry.create( { name: title, folder: folder } );
      }

      let j = {
	path: this.getPath( file ),
	name: journal.name,
	uuid: journal.uuid,
	pages: {},
	newpages: []
      };
      for ( let p of journal.pages.contents ) {
	j.pages[ p.name ] = {
	  name: p.name,
	  id: p.id
	};
      }
      journals[ j.path ] = j;
    }
    return journals;
  }

  async createFolders( form, files ) {
    let folders = {};
    for ( let file of files ) {
      let dirs = file.webkitRelativePath.split( '/' );
      let path = "";
      let cur = form.folder;
      for ( let i = 0; i < dirs.length-1; i++ ) {
	if ( path != "" ) {
	  path += "/";
	}
	path += dirs[i];

	if ( folders[ path ] ) {
	  cur = folders[ path ];
	  continue;
	}

	let found = cur.children.find( e => e.folder.name === dirs[i] );
	if ( found ) {
	  form.message( `found folder ${path}` );
	  folders[ path ] = found.folder;
	  cur = found.folder;
	  continue;
	}

	form.message( `create folder ${path}` );
	let folder = await Folder.create( { type: "JournalEntry", name: dirs[i], parent: cur } );
	folders[ path ] = folder;
	cur = folder;
      }
    }
    return folders;
  }

  async read( form, files ) {
    let folders = await this.createFolders( form, files );

    let journals = await this.createJournals( form, folders, files );
    return journals;
  }
}

export async function importJournals( form, files )
{
  form.message( '<br><h3>Reading Journals</h3><hr>' );
  let i = new JournalCreate();
  return await i.read( form, files );
}
