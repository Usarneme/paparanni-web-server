# Paparanni Photo Blog!

NOTE:
```
mogrify -resize 510 -quality 100 -path public/images/uploads/thumbs/ public/images/uploads/*.jpg
```

Command to create thumbnails relies on Node's child_process.exec(cli_command, (error, stderr, stdout) => {
    if(err) return 'err'
    // etc.
})