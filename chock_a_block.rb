#Remember, you can use any language to talk to the API.  I like Ruby so I'll use it.

require 'httparty'


STOCK = "CREI"
EXCHANGE = "PJIMEX"
ACCOUNT = "SMS71185329"

TARGET_PRICE = 9300
while true
response = HTTParty.get("https://api.stockfighter.io/ob/api/venues/" + EXCHANGE + "/stocks/" + STOCK)


orderbook = response.parsed_response

puts orderbook["ok"]
# true

puts "This is the best bid available -- if we sell stock below this price, we assume we will match this bid"
if orderbook["bids"]
	puts orderbook["bids"][0]
	best_bid = orderbook["bids"][0]["price"]
else 
	puts "No bids?"
	best_bid = nil
end

puts "This is the best ask available -- if we buy stock above this price, we assume we will match this ask"
if orderbook["asks"]
	puts orderbook["asks"][0]
	best_ask = orderbook["asks"][0]["price"]
else
	puts "No asks?"
	best_ask = nil
end

fudge2 = rand(0...11)

if best_ask && best_ask < TARGET_PRICE + fudge2
	initial_qty = rand(20...130)
	fudge = rand(0...11)
	qty = initial_qty
	if orderbook["asks"][0]["qty"] > initial_qty * 10
		qty = initial_qty * 3
		puts "BLAM_TIME!!"
	end

	@result = HTTParty.post("https://api.stockfighter.io/ob/api/venues/" + EXCHANGE + "/stocks/" + STOCK + "/orders", 
   		:body => { :orderType => 'fill-or-kill', 
   	        	    :qty => qty, 
   	    	        :price => best_ask + fudge,
               		:direction => 'buy',
               		:account => ACCOUNT, 
            		 }.to_json,
    			:headers => { 'X-Starfighter-Authorization' => '3a16e84fe1bf94073c274c9d1f9f9e4f6daf0844' } )
	puts @result
	sleep rand(0.02..0.12)
end

end