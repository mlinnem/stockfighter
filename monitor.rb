require 'httparty'
require 'rubygems'
require 'websocket-client-simple'
require 'json'

STOCK = "BOI"
EXCHANGE = "SIPEX"
ACCOUNT = "TDB87994864"

$stockHeld = 0
$moneyHeld = 0
$lastPrice = 0

ws = WebSocket::Client::Simple.connect ('wss://api.stockfighter.io/ob/api/ws/' + ACCOUNT + "/venues/" + EXCHANGE + "/executions/stocks/" + STOCK)

puts ws

ws.on :message do |msg|
  if msg.data.length == 0
 
  elsif
  puts msg.data

  puts "RAW DATA:"
  puts msg.data

  parse_data = JSON.parse(msg.data)
  puts "PARSED DATA:"
  puts JSON.pretty_generate(parse_data)

  order = parse_data["order"]
  price = order['price']
  originalQty = order['originalQty']
  remainingQty = order['qty']
  qty = originalQty - remainingQty

  direction = order['direction']

  $lastPrice = price

  if direction == 'buy'
  	puts "bought " + qty.to_s + " $ " + price.to_s
  	$moneyHeld = $moneyHeld - price * qty
  	$stockHeld = $stockHeld + qty
  elsif direction == 'sell'
  	puts "sold " + qty.to_s + " $ " + price.to_s
  	puts "-Z"
  	puts "money held: " + $moneyHeld.to_s
  	$moneyHeld = $moneyHeld + price * qty
  	puts "-Y"
  	$stockheld = $stockHeld - qty
  end

  printStatus()
end

end

def printStatus
	puts "-A"
	stockValue = 	$stockHeld * $lastPrice

	puts "----------"
	puts "stock held: " + $stockHeld.to_s
	puts "money held: " + $moneyHeld.to_s
	puts "  "
	puts "stock value:" + stockValue.to_s
	puts "  "
	puts "total value:" + ($moneyHeld + stockValue).to_s
	puts "=========="
	puts "  "
	puts "  "
end

ws.on :open do
  ws.send 'hello!!!'
end

ws.on :close do |e|
  p e
  exit 1
end

ws.on :error do |e|
  p e
end

loop do
  ws.send STDIN.gets.strip
end