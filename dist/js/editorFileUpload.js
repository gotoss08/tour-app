'use strict';

$(function () {
    // send file to server handlers
    var uploadHost = void 0,
        uploadAttachment = void 0;

    Trix.config.attachments.preview.caption = {
        name: false,
        size: false
    };

    document.addEventListener('trix-attachment-add', function (event) {
        var attachment = event.attachment;
        if (attachment.file) {
            return uploadAttachment(attachment);
        }
    });

    host = 'http://localhost:3000/post/';
    uploadHost = host + 'upload/';
    requestKeyHost = host + 'key/';

    uploadAttachment = function uploadAttachment(attachment) {
        var file = void 0,
            form = void 0,
            key = void 0,
            xhr = void 0;

        file = attachment.file;

        return $.post(requestKeyHost, { filename: file.name }).done(function (key) {
            form = new FormData();
            form.append('dir', key.dir);
            form.append('filename', key.filename);
            form.append('Content-Type', file.type);
            form.append('file', file);
            xhr = new XMLHttpRequest();
            xhr.open("POST", uploadHost, true);
            xhr.upload.onprogress = function (event) {
                var progress = event.loaded / event.total * 100;
                return attachment.setUploadProgress(progress);
            };
            xhr.onload = function () {
                var href = void 0,
                    url = void 0;
                if (xhr.status === 204) {
                    url = href = 'http://localhost:3000/' + key.dir + key.filename;

                    console.log('href: ' + href);
                    console.log('url: ' + url);

                    return attachment.setAttributes({
                        url: url,
                        href: href
                    });
                }
            };

            return xhr.send(form);
        }).fail(function (xhr, status, error) {
            return console.error(status + ': ' + error + ': ' + xhr.responseJSON.error);
        });
    };
});