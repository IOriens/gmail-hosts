var dns = require("dns");
var sqlite3 = require("sqlite3").verbose();
var db = new sqlite3.Database("./gmail.db");
const fs = require("fs-extra");
const { resolve } = require("path");

dns.setServers(["8.8.8.8", "8.8.4.4"]);

const initTable = () => {
  db.run("CREATE TABLE IF NOT EXISTS ips (ip TEXT UNIQUE) ");
};

const insertRecords = records => {
  var stmt = db.prepare("INSERT OR IGNORE INTO ips VALUES (?)");
  for (var i = 0; i < records.length; i++) {
    stmt.run(records[i]);
  }
  stmt.finalize();
};

const getRecords = () =>
  new Promise((resolve, reject) => {
    db.all("SELECT * FROM ips", function(err, rows) {
      resolve(rows);
    });
  });

const genHosts = rows => {
  let data = rows.map(item => `${item.ip} imap.gmail.com`).join("\n");
  return fs.writeFile(resolve(__dirname, "hosts"), data);
};

const getRecordsAndGenHosts = async () => {
  let rows = await getRecords();
  await genHosts(rows);
};

initTable();

setInterval(() => {
  dns.resolve4("imap.gmail.com", function(err, addresses, family) {
    console.log(new Date());
    console.log(addresses);
    insertRecords(addresses);
    getRecordsAndGenHosts();
  });
}, 1500);
