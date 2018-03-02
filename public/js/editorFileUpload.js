$(() => {
    // send file to server handlers
    let uploadHost, uploadAttachment;

    Trix.config.attachments.preview.caption = {
        name: false,
        size: false
    };

    document.addEventListener('trix-attachment-add', (event) => {
        let attachment = event.attachment;
        if (attachment.file) {
            return uploadAttachment(attachment);
        }
    });

    host = 'http://localhost:3000/post/';
    uploadHost = host + 'upload/';
    requestKeyHost = host + 'key/';

    uploadAttachment = (attachment) => {
        let file, form, key, xhr;

        file = attachment.file;

        return $.post(requestKeyHost, { filename: file.name })
                .done((key) => {
                    form = new FormData();
                    form.append('dir', key.dir);
                    form.append('filename', key.filename);
                    form.append('Content-Type', file.type);
                    form.append('file', file);
                    xhr = new XMLHttpRequest;
                    xhr.open("POST", uploadHost, true);
                    xhr.upload.onprogress = (event) => {
                        var progress = event.loaded / event.total * 100;
                        return attachment.setUploadProgress(progress);
                    };
                    xhr.onload = () => {
                        let href, url;
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
                })
                .fail((xhr, status, error) => {
                    return console.error(`${status}: ${error}: ${xhr.responseJSON.error}`);
                });
    };
});