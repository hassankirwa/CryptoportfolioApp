const csv = require('csv-parser');
const fs = require('fs');
const request = require('request');
const readline = require('readline').createInterface({
  input: process.stdin,
  output: process.stdout
});

const API_KEY = 'ac99fb7cd1aa04a8ce56bed6b31a8c0720f5aff48a9d492c2d626cc44c44fbe6';

let btcTotal = 0;
let ethTotal = 0;
let xrpTotal = 0;
let validDataCount = 0;

const processData = (data) => {
  if (data.token === 'BTC' && data.transaction_type === 'DEPOSIT') {
    btcTotal += +data.amount;
  } else if (data.token === 'BTC' && data.transaction_type === 'WITHDRAWAL') {
    btcTotal -= +data.amount;
  } else if (data.token === 'XRP' && data.transaction_type === 'DEPOSIT') {
    xrpTotal += +data.amount;
  } else if (data.token === 'XRP' && data.transaction_type === 'WITHDRAWAL') {
    xrpTotal -= +data.amount;
  } else if (data.token === 'ETH' && data.transaction_type === 'DEPOSIT') {
    ethTotal += +data.amount;
  } else if (data.token === 'ETH' && data.transaction_type === 'WITHDRAWAL') {
    ethTotal -= +data.amount;
  }
}

const main = () => {
  readline.question(`
    Enter 1, for no parameters, returns the latest portfolio value per token in USD.
    Enter 2, for a token, returns the latest portfolio value for that token in USD.
    Enter 3, for a date, returns the portfolio value per token in USD on that date.
    Enter 4, for a date and a token, returns the portfolio value of that token in USD on that date.
  `, (input) => {
    switch(input) {
      case '1':
        console.log('You have entered 1');
        const readStream = fs.createReadStream('transactions.csv');
        const parseStream = readStream.pipe(csv());
        parseStream.on('data', (data) => {
          validDataCount++;
          processData(data);
        })
        .on('end', () => {
          console.log({ btcTotal, ethTotal, xrpTotal });
          const url = `https://min-api.cryptocompare.com/data/pricemulti?fsyms=BTC,ETH,XRP&tsyms=USD&api_key=${API_KEY}`;
          request({ url: url }, (err, res, body) => {
            if (!err && res.statusCode === 200) {
              const parseData = JSON.parse(body);
              const btcValue = parseData['BTC']['USD'] * btcTotal;
              const ethValue = parseData['ETH']['USD'] * ethTotal;
              const xrpValue = parseData['XRP']['USD'] * xrpTotal;
              console.log(`Total BTC USD: $ ${btcValue.toLocaleString()}`);
              console.log(`Total ETH in USD: $ ${ethValue.toLocaleString()}`);
              console.log(`Total XRP USD: $ ${xrpValue.toLocaleString()}`);
              const totalValue = btcValue + ethValue + xrpValue;
              console.log(`TotalValue:USD ${totalValue.toLocaleString()}`);
              console.log(`Valid data count: ${validDataCount}`);
            } else {
              console.log(`Error: ${err}`);
            }
            readline.close();
          });
        });
        break;
        // Add more cases for the other user inputs here
    }
  });
}

main();

