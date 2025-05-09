window.addEventListener("DOMContentLoaded", () =>{
    let searchBarFrame = document.querySelector("#CodeFinnSAS");

    if(!searchBarFrame)
        return;

    searchBarFrame.innerHTML = template_searchbar;

    let ajaxRequest = function (url : string, data : any) {
        return new Promise(function (resolve, reject) {
            let xhr = new XMLHttpRequest();
            xhr.open('POST', url, true);

            xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');

            xhr.onload = function () {
                if (xhr.status >= 200 && xhr.status < 300) {
                    try {
                        let response = JSON.parse(xhr.responseText);
                        resolve(response);
                    } catch (e) {
                        reject(new Error('Invalid JSON response'));
                    }
                } else {
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
    }

    let input : HTMLInputElement | null = searchBarFrame.querySelector('#SASInput');
    let searchButton : HTMLButtonElement | null = searchBarFrame.querySelector('#SASLoad');
    let resultsFrame : HTMLDivElement | null = searchBarFrame.querySelector('#SASResults');

    let currentRequestIdentifier : number = 0;
    let debounce_timeout : number | undefined;

    if(input && resultsFrame && searchButton){

        let callAjaxSearch = () => {
            if(input.value.length < 1){
                resultsFrame.innerHTML = "";
                if(!resultsFrame.classList.contains("inactive")){
                    resultsFrame.classList.add("inactive");
                }
                return;
            }

            currentRequestIdentifier = Date.now() ;
            let thisRequestIdentifier = currentRequestIdentifier;

            resultsFrame.innerHTML = "";
            if(!resultsFrame.classList.contains("loading")){
                resultsFrame.classList.add("loading");
            }

            if(resultsFrame.classList.contains("inactive")){
                resultsFrame.classList.remove("inactive");
            }

            //@ts-ignore
            ajaxRequest(codefinn_sas_api.ajax_url, {
                action: "GetProductsBySearchName",
                //@ts-ignore
                nonce: codefinn_sas_api.nonce,
                SASLookupProducts: input.value
            }).then((response : any) => {
                //console.log(response);
                if(response.success){
                    if(thisRequestIdentifier < currentRequestIdentifier){
                        return;
                    }

                    //Here you can put your own logic if you wish to adjust the project or add more partials

                    let amount = response["data"]["amount"];


                    //@ts-ignore
                    let link = currentHost + "?s="+input.value+"&post_type=product";

                    if(resultsFrame.classList.contains("loading")){
                        resultsFrame.classList.remove("loading");
                    }

                    resultsFrame.innerHTML = "";
                    if(amount > 0){

                        resultsFrame.innerHTML += template_resultsHeader(amount);

                        for(let i = 0; i < response["data"]["products"].length; i++){
                            let product = response["data"]["products"][i];
                            let product_name = product["name"];
                            let product_price = product["price"];

                            resultsFrame.innerHTML += template_results(product_name, product_price);
                        }

                        resultsFrame.innerHTML += template_resultsFooter(link);
                    }
                    else{
                        resultsFrame.innerHTML += template_resultsNotFound();
                    }
                }
            });
        }

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
            if(resultsFrame.classList.contains("inactive") && resultsFrame.children.length > 0){
                resultsFrame.classList.remove("inactive");
            }
        });

        resultsFrame.addEventListener("mouseleave", () => {
            if(!resultsFrame.classList.contains("inactive")){
                resultsFrame.classList.add("inactive");
            }
        });
    }
});