// Results page: reads ?size=XL from the link, loads data/products.csv,
// and shows the designs that have at least 1 piece in that size.
(function () {
  var CSV_URL = "data/products.csv";
  // Where the product photos are. {design} is replaced by the design code from the CSV.
  // Example: resources/Catalogue/1A/1.png
  var IMAGE_PATH = "resources/Catalogue/{design}/1.png";

  var VALID = ["M", "L", "XL", "2XL"];
  // Size columns in the CSV (header name -> size button on the home page). XXL is the same as 2XL.
  var SIZE_COLS = { m: "M", l: "L", xl: "XL", xxl: "2XL", "2xl": "2XL" };
  // Other columns we use (header names, small letters). The first one found is used.
  var COLS = {
    design:  ["design", "design code", "code"],
    name:    ["name", "title", "product name"],
    desc:    ["description"],
    color:   ["color", "colour"],
    actual:  ["actual-price", "actual price", "mrp"],
    selling: ["selling-price", "selling price", "price"],
    link:    ["market", "flipkart url", "flipkart", "url", "link"]
  };

  var titleEl = document.getElementById("results-title");
  var infoEl = document.getElementById("results-info");
  var msgEl = document.getElementById("results-msg");
  var gridEl = document.getElementById("results-grid");

  function normSize(s) {
    s = String(s).toUpperCase().replace(/[\s._-]/g, "");
    return s === "XXL" ? "2XL" : s;
  }
  function num(v) {
    var n = parseFloat(String(v || "").replace(/[^0-9.]/g, ""));
    return isNaN(n) ? 0 : n;
  }

  var wanted = normSize(new URLSearchParams(location.search).get("size") || "");
  if (VALID.indexOf(wanted) < 0) wanted = "";
  titleEl.textContent = wanted ? "Size " + wanted : "All products";
  document.title = (wanted ? "Size " + wanted : "All products") + " | Farbika Fashion";

  // Small CSV reader: quotes, commas inside quotes, Windows line ends, leading BOM.
  function parseCSV(text) {
    if (text.charCodeAt(0) === 0xfeff) text = text.slice(1);
    var rows = [], row = [], cell = "", q = false, i, ch;
    for (i = 0; i < text.length; i++) {
      ch = text[i];
      if (q) {
        if (ch === '"') { if (text[i + 1] === '"') { cell += '"'; i++; } else q = false; }
        else cell += ch;
      } else if (ch === '"') q = true;
      else if (ch === ",") { row.push(cell); cell = ""; }
      else if (ch === "\n" || ch === "\r") {
        if (ch === "\r" && text[i + 1] === "\n") i++;
        row.push(cell); cell = "";
        if (row.length > 1 || row[0] !== "") rows.push(row);
        row = [];
      } else cell += ch;
    }
    row.push(cell);
    if (row.length > 1 || row[0] !== "") rows.push(row);
    return rows;
  }

  function toProducts(rows) {
    var heads = rows[0].map(function (h) { return h.trim(); });
    var low = heads.map(function (h) { return h.toLowerCase(); });
    var idx = {};
    Object.keys(COLS).forEach(function (key) {
      idx[key] = -1;
      for (var k = 0; k < COLS[key].length && idx[key] < 0; k++) idx[key] = low.indexOf(COLS[key][k]);
    });
    var di = low.indexOf("description");
    var from = di > -1 ? di + 1 : 3;
    var to = idx.actual > -1 ? idx.actual : heads.length;
    var sizeAt = {}; // column number -> size
    low.forEach(function (h, i) { if (SIZE_COLS[h]) sizeAt[i] = SIZE_COLS[h]; });

    return rows.slice(1).map(function (r) {
      function get(key) { return idx[key] > -1 && r[idx[key]] ? r[idx[key]].trim() : ""; }
      var stock = {};
      Object.keys(sizeAt).forEach(function (i) { stock[sizeAt[i]] = num(r[i]); });
      // Attributes = the columns after Description and before the prices (D to V in your sheet).
      var details = [];
      for (var c = from; c < to; c++) {
        var v = r[c] ? r[c].trim() : "";
        if (v && v.toUpperCase() !== "NAN") details.push([heads[c], v]);
      }
      var design = get("design");
      return {
        design: design,
        name: get("name") || (design ? "Design " + design : ""),
        desc: get("desc"),
        color: get("color"),
        actual: num(get("actual")),
        selling: num(get("selling")),
        link: get("link"),
        stock: stock,
        sizes: VALID.filter(function (s) { return stock[s] > 0; }),
        details: details
      };
    }).filter(function (p) { return p.design || p.name; }); // skips the empty rows
  }

  function money(n) { return "\u20B9" + n.toLocaleString("en-IN"); }
  function safeLink(u) { return /^https?:\/\//i.test(u || "") ? u : ""; }
  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text) e.textContent = text;
    return e;
  }

  function photo(p) {
    var ph = el("span", "p-noimg", "Photo soon");
    if (!IMAGE_PATH || !p.design) return ph;
    var img = el("img", "p-img");
    img.src = IMAGE_PATH.replace("{design}", encodeURIComponent(p.design));
    img.alt = p.name + (p.color ? ", " + p.color : "") + (p.design ? ", design " + p.design : "");
    img.width = 600; img.height = 800; img.loading = "lazy"; img.decoding = "async";
    img.addEventListener("error", function () { if (img.parentNode) img.parentNode.replaceChild(ph, img); });
    return img;
  }

  function card(p) {
    var li = el("li", "p-card");
    var pic = el("div", "p-photo");
    pic.appendChild(photo(p));
    li.appendChild(pic);

    var body = el("div", "p-body");
    body.appendChild(el("h2", "p-name", p.name));

    var meta = [p.color, p.design ? "Design " + p.design : ""].filter(Boolean).join(" \u00B7 ");
    if (meta) body.appendChild(el("p", "p-meta", meta));

    if (p.selling) {
      var pr = el("p", "p-price");
      pr.appendChild(el("span", "p-now", money(p.selling)));
      if (p.actual > p.selling) {
        pr.appendChild(el("s", "p-old", money(p.actual)));
        pr.appendChild(el("span", "p-off", Math.round((1 - p.selling / p.actual) * 100) + "% off"));
      }
      body.appendChild(pr);
    }

    if (p.desc) body.appendChild(el("p", "p-desc", p.desc));

    // Only the size she chose (nothing when the page shows all products)
    if (wanted && p.sizes.indexOf(wanted) > -1) {
      body.appendChild(el("p", "p-label", "Size"));
      var sz = el("ul", "p-sizes");
      sz.setAttribute("aria-label", "Size");
      sz.appendChild(el("li", "p-size is-picked", wanted));
      body.appendChild(sz);
    }

    if (p.details.length) {
      var box = el("details", "p-details");
      box.appendChild(el("summary", "", "Product details"));
      var dl = el("dl", "p-dl");
      p.details.forEach(function (d) {
        dl.appendChild(el("dt", "", d[0]));
        dl.appendChild(el("dd", "", d[1]));
      });
      box.appendChild(dl);
      body.appendChild(box);
    }

    var href = safeLink(p.link);
    if (href) {
      var buy = el("a", "p-buy", "View on Flipkart");
      buy.href = href; buy.target = "_blank"; buy.rel = "noopener noreferrer";
      body.appendChild(buy);
    }

    li.appendChild(body);
    return li;
  }

  function showError() {
    msgEl.hidden = false;
    msgEl.textContent = "Sorry, we could not load the products. Please try again in a moment.";
  }

  fetch(CSV_URL)
    .then(function (r) { if (!r.ok) throw new Error("HTTP " + r.status); return r.text(); })
    .then(function (text) {
      var rows = parseCSV(text);
      if (!rows.length) throw new Error("Empty CSV");
      var all = toProducts(rows);
      var found = wanted ? all.filter(function (p) { return p.sizes.indexOf(wanted) > -1; }) : all;

      gridEl.textContent = "";
      found.forEach(function (p) { gridEl.appendChild(card(p)); });

      infoEl.textContent = found.length + (found.length === 1 ? " product found" : " products found");
      var change = el("a", "", "Change size"); change.href = "index.html#sizes"; infoEl.appendChild(change);
      if (wanted) { var all2 = el("a", "", "Show all"); all2.href = "results.html"; infoEl.appendChild(all2); }

      if (found.length) msgEl.hidden = true;
      else { msgEl.hidden = false; msgEl.textContent = "No products in size " + wanted + " yet. Please try another size."; }
    })
    .catch(function (e) { if (window.console) console.error("results.js:", e); showError(); });
})();
