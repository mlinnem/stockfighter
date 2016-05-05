var WebSocket = require('ws');

var STOCK = "IZZ"
var EXCHANGE = "HFHBEX"
var ACCOUNT = "BSJ57113983"

var ws = new WebSocket('wss://api.stockfighter.io/ob/api/ws/' + ACCOUNT + "/venues/" + EXCHANGE + "/executions/stocks/" + STOCK);

var stockHeld = 0
var moneyHeld = 0
var lastPrice = 0

ws.on('open', function open() {
  ws.send('something');
});

ws.on('message', function(data, flags) {
  console.log(data);

  var parsed_data = JSON.parse(data);

  var order = parsed_data["order"];
  var id = order["id"];
  var price = order['price'];
  var originalQty = order['originalQty'];
  var remainingQty = order['qty'];
  var direction = order['direction'];
  var qty = originalQty - remainingQty;

  console.log("price:" + price);

  lastPrice = price

  if (direction == 'buy') {
  	console.log(id + ": bought " + qty + " @ " + price);
  	moneyHeld = moneyHeld - price * qty
  	stockHeld = stockHeld + qty
  } else if (direction == 'sell') {
  	console.log(id + "sold " + qty + " @ " + price);
  	moneyHeld = moneyHeld + price * qty
  	stockheld = stockHeld - qty
  }

  printStatus()

  // flags.binary will be set if a binary data is received.
  // flags.masked will be set if the data was masked.
});

function printStatus() {
	stockValue = 	stockHeld * lastPrice

	console.log( "----------")
	console.log( "stock held: " + stockHeld)
	console.log( "money held: " + moneyHeld)
	console.log( "  ")
	console.log( "stock value:" + stockValue)
	console.log( "  ")
	console.log( "total value:" + (moneyHeld + stockValue))
	console.log( "==========")
	console.log( "  ")
	console.log( "  ")
}