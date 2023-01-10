
console.log(`"${padding(123, 4)}"`);

function padding (string, topad) {
    if (typeof string !== "string") string = string.toString();
    
    let new_string = "";

    for (let i = 0 ; i < (topad - string.length) ; i++) {
        new_string += " ";
    }

    new_string = `${new_string}${string}`;

    return new_string
}