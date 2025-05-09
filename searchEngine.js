"use strict";
//@ts-ignore
let template_results = (product_name, product_price) => { return `<div class="sas-search-record"><span>${product_name}</span><span>${product_price}</span></div>`; };
//@ts-ignore
let template_resultsFooter = (link) => { return `<div><a href="${link}">Look for more</a></div>`; };
//@ts-ignore
let template_resultsHeader = (amount) => {
    return `<div class="available"><span>${amount} - available</span> <b>products</b></div>
<div>
<svg style="width: 20px; height: 20px;" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
<path d="M21,16.5C21,16.88 20.79,17.21 20.47,17.38L12.57,21.82C12.41,21.94 12.21,22 12,22C11.79,22 11.59,21.94 
11.43,21.82L3.53,17.38C3.21,17.21 3,16.88 3,16.5V7.5C3,7.12 3.21,6.79 3.53,6.62L11.43,2.18C11.59,2.06 11.79,2 12,2C12.21,2 
12.41,2.06 12.57,2.18L20.47,6.62C20.79,6.79 21,7.12 
21,7.5V16.5M12,4.15L10.11,5.22L16,8.61L17.96,7.5L12,4.15M6.04,7.5L12,10.85L13.96,9.75L8.08,6.35L6.04,7.5M5,15.91L11,19.29V12.58L5,9.21V15.91M19,15.91V9.21L13,12.58V19.29L19,15.91Z" /></svg>
<span>Available</span> <b>products:</b>
</div>`;
};
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
                    resultsFrame.innerHTML += template_resultsHeader(amount);
                    resultsFrame.innerHTML = "";
                    if (amount > 0) {
                        for (let i = 0; i < response["data"]["products"].length; i++) {
                            let product = response["data"]["products"][i];
                            let product_name = product["name"];
                            let product_price = (product["type"] == "V") ? "(price from " + product["price"] + ")" : product["price"];
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
