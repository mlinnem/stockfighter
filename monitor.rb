require 'httparty'
require 'rubygems'
require 'websocket-client-simple'
require 'json'

STOCK = "BRCM"
EXCHANGE = "JNBAEX"
ACCOUNT = "AB26985603"

$stockHeld = 0
$moneyHeld = 0
$lastPrice = 0

ws = WebSocket::Client::Simple.connect ('wss://api.stockfighter.io/ob/api/ws/' + ACCOUNT + "/venues/" + EXCHANGE + "/executions/stocks/" + STOCK)

puts ws

ws.on :message do |msg|
  puts "start message:"
  puts "RAW DATA:"
  puts msg.to_s
  puts "parsin it"
  begin
  if msg.data != ""
  parse_data = JSON.parse(msg.data)
  puts "PARSED DATA:"
  puts JSON.pretty_generate(parse_data)
  order = parse_data["order"]
  id = order["id"]
  price = order['price']
  originalQty = order['originalQty']
  remainingQty = order['qty']
  qty = originalQty - remainingQty

  direction = order['direction']

  $lastPrice = price

  if direction == 'buy'

  	puts id.to_s + ": bought " + qty.to_s + " @ " + price.to_s
  	$moneyHeld = $moneyHeld - price * qty
  	$stockHeld = $stockHeld + qty
  elsif direction == 'sell'
  	puts id.to_s + "sold " + qty.to_s + " @ " + price.to_s
  	$moneyHeld = $moneyHeld + price * qty
  	$stockheld = $stockHeld - qty
  end

  printStatus()
else
  puts "twas empty, the data!"
end
rescue Exception => e
	puts "suppressing an error"
  puts e
end

end

def printStatus
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
  puts "sending hello"
  ws.send 'hello!!!'
end

ws.on :close do |e|
  puts "closed"
  p e
  exit 1
end

ws.on :error do |e|
   puts "ERRORRRR"
  p e
end

loop do
  ws.send "stayin alive"
  puts "I sent that data yo"
  sleep 10
end