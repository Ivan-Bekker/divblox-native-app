export const isJsonString = function (inputString) {
    try {
        JSON.parse(inputString);
    } catch (e) {
        return false;
    }
    return true;
}

export const dxRequestInternal = async function (url, postBodyObj) {
    try {
        let response = await fetch(url, {
            method: "POST",
            headers: {
                Accept: "application/json",
                "Content-Type": "application/json",
            },
            body: JSON.stringify(postBodyObj),
        });
        let json = await response.json();
        if (typeof json.Result !== "undefined") {
            if (json.Result === "Success") {
                return json;
            } else {
                return {dxRequestInternalError: json};
            }
        } else {
            return {dxRequestInternalError: json};
        }
    } catch (error) {
        console.error(error);
        return {dxRequestInternalError: error};
    }
}