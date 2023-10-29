
export class linkCompendium {

  async init( form ) {
    let settings = game.settings.get( "zobsidian", "compendium" );
    
    this.compendiums = {};
    for ( let s of settings ) {
      if ( s.dir == "" || s.comp == "" ) {
	continue;
      }
      let pack = game.packs.get( s.comp );
      if ( !pack ) {
	form.message( `<font color="red">ERROR: no compendium ${s.comp}</font>` );
	continue;
      }

      let db = {
	dir: s.dir,
	name: s.comp,
	pack: pack,
	byname: new Map(),
	byid: new Map()
      };

      let index = null;
      if ( pack.documentName == "JournalEntry" ) {
	// read journal pages
	index = [];
	for ( let j of await pack.getIndex() ) {
	  let journal = await fromUuid( j.uuid );
	  for ( let page of journal.pages.contents ) {
	    index.push( { name: page.name,
			  uuid: page.uuid,
			  flags: {
			    zdnd: {
			      id: page?.flags?.zdnd?.id
			    }
			  }} );
	  }
	}
      } else {
	index = await pack.getIndex( { fields: [ "inCombat", "zid", "flags.zdnd.id" ] } );
      }
      form.message( `Read pack ${s.comp} with ${index.size} entries` );

      for ( let s of index ) {
	db.byname.set( s.name, { name: s.name, uuid: s.uuid } );
	let zid = s?.flags?.zdnd?.id;
	if ( zid ) {
	  db.byid.set( zid, { name: s.name, uuid: s.uuid } );
	}
      }
      this.compendiums[ s.dir ] = db;
    }
  }

};
