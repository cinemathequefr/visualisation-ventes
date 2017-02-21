

_.templateSettings.interpolate = /{{([\s\S]+?)}}/g; // Set mustache-style interpolate delimiters
moment.locale("fr", { monthsShort: "jan_fév_mar_avr_mai_juin_juil_aoû_sep_oct_nov_déc".split("_"), weekdaysShort: "Dim_Lun_Mar_Mer_Jeu_Ven_Sam".split("_") });

var capacity = { "1": 413, "2": 186, "3": 93 };
var temp = _.template([
  "<table>",
  "<tr><th style='width: 22%;'>Date</th><th style='width: 7%;'>Salle</th><th style='width: 7%;'>Ventes</th><th class='small' style='width: 7%;'>(dont Web)</th><th class='small' style='width: 7%;'>(dont LP)</th><th>Manifestation</th></tr>",
  "<% _.forEach(data, function (row) { %>",
  "<tr>",
  "<td class='center'>{{ moment(row.date).format('ddd D MMM YYYY HH:mm') }}</td>",
  "<td class='center'>{{ row.salle.code }}</td>",
  "<td class='right'>{{ row.tickets.compte }}</td>",
  "<td class='right small'>{{ row.tickets.web }}</td>",
  "<td class='right small'>{{ row.tickets.lp }}</td>",
  "<td>{{ _.upperFirst(_.toLower(row.manifestation)) }}</td>",
  "</tr>",
  "<% }); %>",
  "</table>"
].join(""));

$(function () {
  var inputElement = document.getElementById("file");
  var $dz = $(".dropzone").eq(0);

  $dz.on("click", function (e) { $(inputElement).trigger("click"); });

  $dz.on("dragover", function (e) { e.preventDefault(); $(this).addClass("hover"); });
  $dz.on("dragleave", function () { $(this).removeClass("hover"); });
  $dz.on("drop", function (e) {
    e.preventDefault();
    var file = e.originalEvent.dataTransfer.files[0];
    handleFile(null, file);
    $(this).removeClass("hover");
  });

  inputElement.addEventListener("change", handleFile, false);

  function handleFile (e, file) {
    file = file || this.files[0];
    Papa.parse(file, { encoding: "CP1252", header: true, skipEmptyLines: true, dynamicTyping: true, complete: readData }); // http://papaparse.com/docs#config
  }

  function readData (o) {
    var data = aggregateToSeance(o.data);
    $(".result").html(temp({ "data": data }));
  };

});


function aggregateToSeance (data) {
  return _(data)
  .groupBy(function (item) {
    return item["Début Représentation"] + item["ID Lieu"];
  })
  .map(function (items) {
    return _.assign({}, {
      date: items[0]["Début Représentation"],
      salle: {
        "10551": { id: 1, code: "HL" },
        "10789": { id: 2, code: "GF" },
        "10783": { id: 3, code: "JE" }
      }[items[0]["ID Lieu"]],
      "manifestation": items[0]["Nom Produit"],
      tickets: {
        compte: items.length,
        lp: _(items).filter(function (item) { return _.indexOf([1862576, 2003563, 1968650, 1863782, 1863730, 1862470], item["ID Tarif"]) > -1; }).value().length,
        web: _(items).filter(function (item) { return _.indexOf([7096, 7216], item["ID Canal de vente"]) > -1; }).value().length
      }
    })
  })
  .filter(function (d) { return !_.isUndefined(d.salle); }) // Retire les items hors salle de cinéma
  .sortBy("salle.id")
  .sortBy("date")
  .value();
}

