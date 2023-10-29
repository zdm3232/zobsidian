
import {importMarkdown} from './import-markdown.js';
import {importImages} from './import-image.js';
import {importJournals} from './import-journals.js';
import {initSettings} from './settings.js';
import {linkCompendium} from './compendium.js';


// create menu option on journal entry folder
let origGetFolderContextOptions = SidebarDirectory.prototype._getFolderContextOptions;
SidebarDirectory.prototype._getFolderContextOptions = function() {
  let opts = origGetFolderContextOptions();
  opts.push(
    {
      name: "Import Obsidian",
      icon: `<i class="fas fa-upload"></i>`,
      condition: header => {
	if ( !game.user.isGM ) {
	  return false;
	}
        const folder = game.folders.get(header.parent().data("folderId"));
	return folder.type === "JournalEntry";
      },
      callback: header => {
        const li = header.parent();
        const folder = game.folders.get( li.data("folderId") );
	doImport( folder );
      }
    });
  return opts;
}

class importMarkdownForm extends FormApplication {
  constructor( folder ) {
    super();
    this.folder = folder;
    this.vaultFiles = [];
  }

  message( msg ) {
    let log = this.element.find( 'div#zobslog' )[0];
    if ( !log ) {
      return;
    }

    log.innerHTML += `${msg}<br>\n`;
    log.scrollTop = log.scrollHeight;
  }

  static get defaultOptions() {
    let obj = mergeObject( super.defaultOptions, {
      closeOnSubmit: false,
      submitOnChange: false,
      submitOnClose: false,
      width: 600,
      template: "modules/zobsidian/dialog.html",
      title: "Import Obsidian",
      id: "import-obsidian"
    });
    return obj;
  }

  activateListeners( html ) {
    $(`#vaultFiles`).on('change', (event) => {
      this.vaultFiles = event.target.files;
    });
  }

  async _updateObject( event, formData ) {
    if ( event.submitter.value != "submit" ) {
      return;
    }

    let mdfiles = [];
    let imgfiles = [];
    for ( let file of this.vaultFiles ) {
      if ( file.name.match( /^\./ ) ) {
	continue;
      }
      if ( file.type.match( /^image/ ) ) {
	imgfiles.push( file );
      } else if ( file.name.match( /\.md$/ ) ) {
	mdfiles.push( file );
      }
    }

    this.links = new linkCompendium();
    await this.links.init( this );

    let doimages = ( formData.doimages == "doimages" );
    this.images = await importImages( this, imgfiles, doimages );

    this.journals = await importJournals( this, mdfiles );

    await importMarkdown( this, mdfiles );
  }
};


async function doImport( folder )
{
  await new importMarkdownForm( folder ).render( true );
}

Hooks.once( "init", function() {
  initSettings();
});

