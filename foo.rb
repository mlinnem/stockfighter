#Remember, you can use any language to talk to the API.  I like Ruby so I'll use it.

require 'httparty'

price = 0 

STOCK = "BMC"
EXCHANGE = "SEOVEX"
while true


response = HTTParty.get("https://api.stockfighter.io/ob/api/venues/SEOVEX/stocks/BMC/")

orderbook = response.parsed_response

puts orderbook["ok"]
# true

puts "This is the best bid available -- if we sell stock below this price, we assume we will match this bid"

puts "best bid:" 
if orderbook["bids"]
	puts orderbook["bids"][0]
else
	puts "None"
end

puts "-"

puts "best ask:"
if orderbook["bids"]
	puts orderbook["asks"][0]
else
	puts "None"
end


#qty = rand(400...1200)

#pricemodifier = rand(300...400)

#price = 2600

#$result = HTTParty.post("https://api.stockfighter.io/ob/api/venues/BMLEX/stocks/KEIN/orders", 
#    :body => { :orderType => 'fill-or-kill', 
#               :qty => qty, 
#               :price => price,
#               :direction => 'buy', 
#               :account => 'ES36812134', 
#             }.to_json,
#    :headers => { 'X-Starfighter-Authorization' => '3a16e84fe1bf94073c274c9d1f9f9e4f6daf0844' } )
#puts $result

#$result = HTTParty.post("https://api.stockfighter.io/ob/api/venues/SEOVEX/stocks/BMC/orders", 
#    :body => { :orderType => 'limit', 
#               :qty => qty, 
 #              :price => price - pricemodifier,
#               :direction => 'buy', 
#               :account => 'WAH186186', 
##             }.to_json,
 #   :headers => { 'X-Starfighter-Authorization' => '3a16e84fe1bf94073c274c9d1f9f9e4f6daf0844' } )
#puts $result
end