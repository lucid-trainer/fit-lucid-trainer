export const postMessage = (msg, url) => 
    new Promise(function (resolve, reject) {
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


