

class importImage {
  getImagePath( file ) {
    let root = "vaultimages";
    let path = file.webkitRelativePath.replace( /\/[^\/]+$/, "" );
    let imgpath = `${root}/${path}`;
    return imgpath;
  }

  async createDirs( form, files ) {
    let done = {};
    for ( let file of files ) {
      let imgpath = this.getImagePath( file );
      let dirs = imgpath.split( '/' );
      let path = "";
      for ( let d of dirs ) {
	if ( path != "" ) {
	  path += "/";
	}
	path += d;
	if ( done[ path ] ) {
	  continue;
	}
	form.message( `create directory ${path}` );
	try { await FilePicker.createDirectory( 'data', path, {} ); }
	catch {};
	done[ path ] = 1;
      }
    }
  }

  async upload( form, files, enable ) {
    form.message( '<br><h3>Importing Images</h3><hr>' );
    if ( enable ) {
      await this.createDirs( form, files );
    }
    let images = {};
    let cnt = 0;
    for ( let file of files ) {
      let imgpath = this.getImagePath( file );
      const source = 'data';
      const body = {};
      if ( enable ) {
	form.message( `import image ${file.webkitRelativePath}` );
	await FilePicker.upload( source, imgpath, file, body );
      }
      images[ file.webkitRelativePath ] = `${imgpath}/${file.name}`;
      cnt++;
    }
    form.message( `${cnt} images available` );
    return images;
  }
}

async function processImage( file )
{
  console.log( file );
  let imgData = await file.text();

  // Load the data into an image
  let rawImage = new Image();
  rawImage.src = imgData;
  let canvas = document.createElement('canvas');
  let ctx = canvas.getContext("2d");

  canvas.width = rawImage.width;
  canvas.height = rawImage.height;
  await ctx.drawImage(rawImage, 0, 0);
  console.log( '--> draw' );

  await canvas.toBlob( function (blob) {
    console.log( '--> toblob' );
    console.log( blob );
  }, "image/webp", 0.8 );
  
  console.log( '--> done' );
}

export async function importImages( form, files, enable )
{
  let upload = new importImage();
  return upload.upload( form, files, enable );
}
