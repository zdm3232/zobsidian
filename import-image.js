

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

  async uploadImage( file, imgpath ) {
    const source = 'data';
    const body = {};
    await FilePicker.upload( source, imgpath, file, body );
  }

  async convert( form, file ) {
    let imgpath = this.getImagePath( file );
    if ( file.name.match( /\.webp$/ ) ) {
      form.message( `upload webp image ${file.webkitRelativePath}` );
      await this.uploadImage( file, imgpath );
      return;
    }

    const image = new Image();
    image.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = image.naturalWidth;
      canvas.height = image.naturalHeight;
      canvas.getContext('2d').drawImage( image, 0, 0 );
      canvas.toBlob( async(blob) => {
	let filename = file.name.replace( /\.[^\.]+$/, ".webp" );
	const myImage = new File( [blob], filename, { type: blob.type });
	form.message( `upload webp image ${file.webkitRelativePath}` );
	await this.uploadImage( myImage, imgpath );
      }, 'image/webp');
    };
    image.src = URL.createObjectURL( file );
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
	await this.convert( form, file );
      }
      let filename = file.name.replace( /\.[^\.]+$/, ".webp" );
      images[ file.webkitRelativePath ] = `${imgpath}/${filename}`;
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
