const { lstatSync, readdirSync } = require('fs')
const { join } = require('path')

const isDirectory = source => lstatSync(source).isDirectory();
const getDirectories = source => readdirSync(source).map(name => join(source, name)).filter(isDirectory);

const directories = getDirectories('public/post_files/');
console.log(`directories: ${directories}`);

const directoryFiles = directories.map(dir => join(__dirname, dir, '*.{jpg,png}'));
console.log(`directory files: ${directoryFiles}`);

const imagemin = require('imagemin');
const imageminJpegtran = require('imagemin-jpegtran');
const imageminPngquant = require('imagemin-pngquant');

imagemin(directoryFiles, 'build/images', {
    plugins: [
        imageminJpegtran(),
        imageminPngquant({quality: '65-80'})
    ]
}).then(() => {
    console.log('Images optimized');
});
