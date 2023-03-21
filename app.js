const needle = require("needle");
const fs = require("fs");

const gql = (name) => {
  return {
    operationName: "UsernameValidator_User",
    variables: { username: name },
    extensions: {
      persistedQuery: {
        version: 1,
        sha256Hash:
          "fd1085cf8350e309b725cf8ca91cd90cac03909a3edeeedbd0872ac912f3d660",
      },
    },
  };
};

function checkNames(names) {
  return new Promise((resolve, reject) => {
    const gqls = names.map(gql);
    needle("post", "https://gql.twitch.tv/gql", gqls, {
      json: true,
      headers: {
        "Client-ID": "kimne78kx3ncx6brgo4mv6wki5h1ko",
      },
    }).then((res) => {
      if (Array.isArray(res.body) === false) {
        console.log("Error: ", res.body);
        return;
      }
      let index = 0;
      const available = [];
      const unavailable = [];
      for (let returnedData of res.body) {
        if (returnedData.data.isUsernameAvailable) available.push(names[index]);
        else unavailable.push(names[index]);

        index++;
      }

      fs.appendFile("names_available.txt", available.join("\r\n"), (err) => {
        if (err) throw err;
      });
      fs.appendFile(
        "names_unavailable.txt",
        unavailable.join("\r\n"),
        (err) => {
          if (err) throw err;
        }
      );

      resolve({
        available: available.length,
        unavailable: unavailable.length,
      });
    });
  });
}

fs.readFile("names.txt", "utf8", async function (err, data) {
  if (err) {
    return console.log(err);
  }
  const names = data.split("\n");

  if (names.length === 0) return console.log("No names found!");

  const roboto = names.length;

  const chunks = [];
  while (names.length) {
    chunks.push(names.splice(0, 30));
  }

  let gqlRequests = 0;

  let available = 0;
  let unavailable = 0;
  for (let chunk of chunks) {
    console.log(chunk.length + " names being checked");
    const checkNamesData = await checkNames(chunk);

    available += checkNamesData.available;
    unavailable += checkNamesData.unavailable;
    gqlRequests++;
  }

  console.log("Available: " + available);
  console.log("Unavailable: " + unavailable);

  console.log(
    "Done! ( " +
      gqlRequests +
      " requests made ) ( would've taken " +
      roboto +
      " requests with robotos method )"
  );
  console.log("made by discord.gg/kappa");
});
