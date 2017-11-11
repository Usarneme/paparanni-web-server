const tagInput = document.getElementById('tagInput');

// Function on a Tag type button click adds that tag to the tags filter field input
var addTag = function(event) {
    event.preventDefault();
    tagInput.value = tagInput.value + ' ' + event.innerText;
}