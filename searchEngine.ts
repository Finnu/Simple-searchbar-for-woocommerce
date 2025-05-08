window.addEventListener("DOMContentLoaded", () =>{
    let searchBarFrame = document.querySelector("#CodeFinnSAS");

    if(!searchBarFrame)
        return;

    searchBarFrame.innerHTML = template_searchbar;

    let input = searchBarFrame.querySelector('#SASInput');
    let searchButton = searchBarFrame.querySelector('#SASLoad');
    let resultsFrame = searchBarFrame.querySelector('#SASResults');
    if(input && resultsFrame && searchButton){

    }
});