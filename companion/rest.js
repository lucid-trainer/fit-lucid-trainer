export class RestAPI {
    constructor(apiKey) {
        if (apiKey !== undefined) {
            this.apiKey = apiKey;
        }
        else {
            // Default key for open public access.
            this.apiKey = "DUMMY KEY";
        }
    }
    postMessage(msg) {
        return new Promise(function (resolve, reject) {
            let url = "https://httpbin.org/post";
            fetch(url, {
                method: "POST",
                body: JSON.stringify(msg),
                headers: { "Content-type": "application/json; charset=UTF-8" }
            })
                .then(response => response.json())
                .then(json => {
                    console.log("response " + json.data);
                    resolve(json);
                }
                )
                .catch(error => reject(error));
        });
    }
};

