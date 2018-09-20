const dns = require("dns");
const fs = require("fs-extra");
const { resolve } = require("path");
const sqlite3 = require("sqlite3").verbose();

const db = new sqlite3.Database("./gmail.db");

dns.setServers(["8.8.8.8", "8.8.4.4"]);

const initTable = () => {
  db.run("CREATE TABLE IF NOT EXISTS ips (ip TEXT UNIQUE) ");
};

const insertRecords = records => {
  let stmt = db.prepare("INSERT OR IGNORE INTO ips VALUES (?)");
  for (let i = 0; i < records.length; i++) {
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
  try {
    let rows = await getRecords();
    await genHosts(rows);
  } catch (e) {
    console.log(e);
  }
};

initTable();

setInterval(() => {
  dns.resolve4("imap.gmail.com", function(err, addresses, family) {
    if (err) {
      console.log(err);
      return
    }
    console.log(new Date());
    console.log(addresses);
    insertRecords(addresses);
    getRecordsAndGenHosts();
  });
}, 1500);
