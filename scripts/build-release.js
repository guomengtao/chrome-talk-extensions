const fs = require('fs');
const archiver = require('archiver');
const path = require('path');

const extensions = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i'];
const version = '1.0.0';

// 创建发布目录
const releaseDir = path.join(__dirname, '../release');
if (!fs.existsSync(releaseDir)) {
    fs.mkdirSync(releaseDir);
}

// 为每个扩展创建 zip 文件
extensions.forEach(ext => {
    const output = fs.createWriteStream(path.join(releaseDir, `talk-${ext}-v${version}.zip`));
    const archive = archiver('zip', {
        zlib: { level: 9 }
    });

    output.on('close', () => {
        console.log(`talk-${ext}: ${archive.pointer()} bytes`);
    });

    archive.on('error', (err) => {
        throw err;
    });

    archive.pipe(output);
    archive.directory(`talk-${ext}/`, false);
    archive.finalize();
}); 