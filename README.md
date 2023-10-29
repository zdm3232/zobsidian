# zobsidian

## Import
Right click on a folder, there is an "import obsidian" option.

Select a folder to import.  All files in all sub directories will be imported.

Select to import images if desired.  They will be placed under Data/vaultimages.  Images are directed converted to webp.

## Import Details

The import flow consists of

- upload/convert images while collecting link
- read and create if needed all journals associated with each markdown file
  - all journal and page ids to reuse so that any notes or references are not lost
  - reads all journals and could create links across imports if in same folder
- translate markdown to html and correct all links to UUID.
  - ids are reused and all pages all overwritten

## Compendiums

The correction of links includes compendium lookups.  In the settings for the module you can provide a mapping between a directory name and a compendium.  For example, you could map "monsters" to a compendium "mydnd.monsters".  Any markdown link similar to [[monsters/Goblin.md]] will instead look in the mydnd.monsters for an actor named Goblin and create that link.

To make this functional in obsidian, one would have to create a directory "monsters", which a file Goblin.md (could be empty).  This can be done for any actors, items, or even journals for linking rules like Prone.

