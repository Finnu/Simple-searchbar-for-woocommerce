"use strict";
//@ts-ignore
let template_results = (product_name, product_price) => { return `<div><span>${product_name}</span><span>${product_price}</span></div>`; };
//@ts-ignore
let template_resultsFooter = (link) => { return `<div><a href="${link}">Look for more</a></div>`; };
//@ts-ignore
let template_resultsHeader = (amount) => { return `<div>${amount} - available <span>products</span></div>`; };
let template_resultsNotFound = () => { return `<div>There are no matching records.</div>`; };
let template_searchbar = `
<div>
    <input type="text" placeholder="Type name of a product" id="SASInput"/>
    <button id="SASLoad">
            <svg style="width: 20px; height: 20px;" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M9.5,3A6.5,6.5 0 0,1 16,9.5C16,11.11 15.41,12.59 14.44,13.73L14.71,14H15.5L20.5,19L19,20.5L14,15.5V14.71L13.73,14.44C12.59,15.41 11.11,16 9.5,16A6.5,6.5 0 0,1 3,9.5A6.5,6.5 0 0,1 9.5,3M9.5,5C7,5 5,7 5,9.5C5,12 7,14 9.5,14C12,14 14,12 14,9.5C14,7 12,5 9.5,5Z" /></svg>
    </button>
    <div id="SASResults" class="inactive"></div>
</div>
`;
window.addEventListener("DOMContentLoaded", () => {
    let searchBarFrame = document.querySelector("#CodeFinnSAS");
    if (!searchBarFrame)
        return;
    searchBarFrame.innerHTML = template_searchbar;
    let ajaxRequest = function (url, data) {
        return new Promise(function (resolve, reject) {
            let xhr = new XMLHttpRequest();
            xhr.open('POST', url, true);
            xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
            xhr.onload = function () {
                if (xhr.status >= 200 && xhr.status < 300) {
                    try {
                        let response = JSON.parse(xhr.responseText);
                        resolve(response);
                    }
                    catch (e) {
                        reject(new Error('Invalid JSON response'));
                    }
                }
                else {
                    reject(new Error('Request failed with status ' + xhr.status));
                }
            };
            xhr.onerror = function () {
                reject(new Error('Request failed due to a network error'));
            };
            let queryString = '';
            for (let key in data) {
                if (data.hasOwnProperty(key)) {
                    queryString += encodeURIComponent(key) + '=' + encodeURIComponent(data[key]) + '&';
                }
            }
            queryString = queryString.slice(0, -1);
            xhr.send(queryString);
        });
    };
    let input = searchBarFrame.querySelector('#SASInput');
    let searchButton = searchBarFrame.querySelector('#SASLoad');
    let resultsFrame = searchBarFrame.querySelector('#SASResults');
    let currentRequestIdentifier = 0;
    let debounce_timeout;
    if (input && resultsFrame && searchButton) {
        let callAjaxSearch = () => {
            if (input.value.length < 1) {
                resultsFrame.innerHTML = "";
                if (!resultsFrame.classList.contains("inactive")) {
                    resultsFrame.classList.add("inactive");
                }
                return;
            }
            currentRequestIdentifier = Date.now();
            let thisRequestIdentifier = currentRequestIdentifier;
            resultsFrame.innerHTML = "";
            if (!resultsFrame.classList.contains("loading")) {
                resultsFrame.classList.add("loading");
            }
            if (resultsFrame.classList.contains("inactive")) {
                resultsFrame.classList.remove("inactive");
            }
            //@ts-ignore
            ajaxRequest(codefinn_sas_api.ajax_url, {
                action: "GetProductsBySearchName",
                //@ts-ignore
                nonce: codefinn_sas_api.nonce,
                SASLookupProducts: input.value
            }).then((response) => {
                //console.log(response);
                if (response.success) {
                    if (thisRequestIdentifier < currentRequestIdentifier) {
                        return;
                    }
                    //Here you can put your own logic if you wish to adjust the project or add more partials
                    let amount = response["data"]["amount"];
                    //@ts-ignore
                    let link = currentHost + "?s=" + input.value + "&post_type=product";
                    if (resultsFrame.classList.contains("loading")) {
                        resultsFrame.classList.remove("loading");
                    }
                    resultsFrame.innerHTML = "";
                    if (amount > 0) {
                        resultsFrame.innerHTML += template_resultsHeader(amount);
                        for (let i = 0; i < response["data"]["products"].length; i++) {
                            let product = response["data"]["products"][i];
                            let product_name = product["name"];
                            let product_price = product["price"];
                            resultsFrame.innerHTML += template_results(product_name, product_price);
                        }
                        resultsFrame.innerHTML += template_resultsFooter(link);
                    }
                    else {
                        resultsFrame.innerHTML += template_resultsNotFound();
                    }
                }
            });
        };
        resultsFrame.innerHTML = "";
        input.addEventListener("input", () => {
            clearTimeout(debounce_timeout);
            debounce_timeout = setTimeout(() => {
                callAjaxSearch();
            }, 500);
        });
        searchButton.addEventListener("click", () => {
            callAjaxSearch();
        });
        input.addEventListener("click", () => {
            if (resultsFrame.classList.contains("inactive") && resultsFrame.children.length > 0) {
                resultsFrame.classList.remove("inactive");
            }
        });
        resultsFrame.addEventListener("mouseleave", () => {
            if (!resultsFrame.classList.contains("inactive")) {
                resultsFrame.classList.add("inactive");
            }
        });
    }
});
