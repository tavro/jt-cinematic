function formatDate(isoString) {
  const date = new Date(isoString);

  const options = {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  };

  return date.toLocaleString("en-US", options);
}

const API_URL =
  "https://script.google.com/macros/s/AKfycbxshyAZ5R4kVjaG8dIWMVOuntEjSLGiYEsM1hJu9flLqaDYJp4biC2O1U9pt0whank5/exec";

async function scrapeGoogleSheet() {
  try {
    const response = await fetch(API_URL);
    if (!response.ok) {
      throw new Error(`Failed to fetch data: ${response.statusText}`);
    }

    const data = await response.json();

    const watchlist = document.getElementById("watchlist");
    watchlist.innerHTML = "";

    data.forEach(async (row, index) => {
      if (index > 0 && row[0] && row[1] && row[2]) {
        console.log(`Row ${index + 1}:`, row);
        let title = row[1];
        let coverImage = "";
        const movieItem = document.createElement("li");
        const imdbMatch = title.match(/tt\d+/);
        try {
          const imdbId = imdbMatch[0];
          const res = await fetch(
            `https://www.omdbapi.com/?i=${imdbId}&apikey=46fb2f77`
          );
          const data = await res.json();
          console.log(data);
          if (data.Response === "True") {
            title = data.Title;
            coverImage = data.Poster !== "N/A" ? data.Poster : "";
          } else {
            alert("Failed to fetch movie details.");
            return;
          }
          movieItem.innerHTML = `
                    <div class="movie-content">
                        <div>
                        <strong>${title}</strong>
                        <span>Added by ${row[2]} on ${formatDate(row[0])}</span>
                        <div class="movie-actions">
                            <!--
                            <button class="mark-seen" title="Mark as Seen">&#128065;</button>
                            <button class="remove" title="Remove">&#10060;</button>
                            -->
                        </div>
                        </div>
                        ${
                          coverImage
                            ? `<img src="${coverImage}" alt="${title} Poster" class="movie-poster">`
                            : ""
                        }
                    </div>
                    `;
        } catch (error) {
          console.error("Error fetching IMDb data:", error);
          alert("An error occurred while fetching movie details.");
          return;
        }
        watchlist.appendChild(movieItem);
      }
    });
  } catch (error) {
    console.error("Error:", error);
  }
}

scrapeGoogleSheet();

function submitGoogleForm(imdbLink, person) {
  const formUrl =
    "https://docs.google.com/forms/d/e/1FAIpQLSfACGwYSQzvIfvSgscsJ9AnnIu_ZTYE4aO8hlRJlX1mg16mSA/formResponse";

  let iframe = document.createElement("iframe");
  iframe.style.display = "none";
  iframe.name = "hiddenIframe";
  document.body.appendChild(iframe);

  const form = document.createElement("form");
  form.action = formUrl;
  form.method = "POST";
  form.target = "hiddenIframe";

  const imdbLinkInput = document.createElement("input");
  imdbLinkInput.type = "hidden";
  imdbLinkInput.name = "entry.49437424";
  imdbLinkInput.value = imdbLink;
  form.appendChild(imdbLinkInput);

  const sentinelInput = document.createElement("input");
  sentinelInput.type = "hidden";
  sentinelInput.name = "entry.526062523";
  sentinelInput.value = person;
  form.appendChild(sentinelInput);

  document.body.appendChild(form);

  iframe.onload = function () {
    setTimeout(() => {
      document.body.removeChild(form);
      document.body.removeChild(iframe);
    }, 1000);
  };

  form.submit();
}

document
  .getElementById("movie-form")
  .addEventListener("submit", async function (event) {
    event.preventDefault();

    const titleOrLink = document.getElementById("movie-title").value.trim();
    const user = document.getElementById("user-selector").value;

    if (titleOrLink && user) {
      submitGoogleForm(titleOrLink, user);
      scrapeGoogleSheet();

      document.getElementById("movie-title").value = "";
      document.getElementById("user-selector").value = "";
    }
  });
