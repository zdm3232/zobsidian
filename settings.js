

class compendiumForm extends FormApplication {
  constructor() {
    super();
  }

  getData() {
    let compendiums = game.settings.get( "zobsidian", "compendium" );
    let data = {};
    for ( let i = 0; i < 6; i++ ) {
      data[ `dir${i+1}` ] = compendiums[i].dir;
      data[ `comp${i+1}` ] = compendiums[i].comp;
    }
    return data;
  }

  static get defaultOptions() {
    let obj = mergeObject( super.defaultOptions, {
      closeOnSubmit: true,
      submitOnChange: false,
      submitOnClose: false,
      width: 600,
      template: "modules/zobsidian/compendium.html",
      title: "Import Obsidian Compendiums",
      id: "import-obsidian-compendium"
    });
    return obj;
  }

  async _updateObject( event, formData ) {
    if ( event.submitter.value != "submit" ) {
      return;
    }

    let compendiums = game.settings.get( "zobsidian", "compendium" );
    for ( let i = 0; i < 6; i++ ) {
      compendiums[i].dir = formData[ `dir${i+1}` ];
      compendiums[i].comp = formData[ `comp${i+1}` ];
    }
    game.settings.set( "zobsidian", "compendium", compendiums );
  }
};


export function initSettings()
{
  game.settings.registerMenu( "zobsidian", "compendiumMenu", {
    name: "Compendium Settings",
    label: "Compendium Settings",
    hint: "Mapping for vault directories to compendiums",
    scope: "client",
    type: compendiumForm,
    config: true
  });

  game.settings.register( "zobsidian", "compendium", {
    name: "Compendiums",
    scope: "client",
    type: Array,
    default: [ { dir: "", comp: "" },
	       { dir: "", comp: "" },
	       { dir: "", comp: "" },
	       { dir: "", comp: "" },
	       { dir: "", comp: "" },
	       { dir: "", comp: "" } ],
    config: false
  });

}
