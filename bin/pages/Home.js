document.getElementById("search").addEventListener("keypress", event => {
    if (event.code === "Enter") {
        console.log("submitting")
        document.location = `/doujin?q=${event.target.value}`
    }
})