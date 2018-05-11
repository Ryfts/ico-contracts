## Deployment & usage

1. Contructors arguments on deployment:
 * Reserve account (team allocation): 0xD2d341E028e5F376DF7F740E3752887C68A838C5
 * Reserve amount (3 mil): 3000000000000000000000000
 * Initial supply (33 mil): 33000000000000000000000000
 * Token name: Ryfts
 * Token symbol: RFT
 * Multivest middleware (address used to transfer ETH for BTC): 0xb8D59D31ddD8Cf27c03b7d0FBA5178f061edaDcd
 * Locked: enable only if you don't wan 


2. Use function "Set sale phases" to set pre-ico and ico start date.


For the sale phase parameters are:
 * Pre-ICO token price in wei (i.e. 0.0008 ETH): 800000000000000
 * Pre-ICO since in unix time: 
 * Pre-ICO till in unix time:
 * Allocated tokens for pre-ico (i.e. 30% of supply: 9900000): 9900000000000000000000000
 * Min pre-ico contribution (i.e. 5 ETH): 5000000000000000000
 * Max pre-ico contribution (i.e. 100 ETH): 100000000000000000000
 * ICO token price in wei (i.e. 0.001 ETH): 1000000000000000
 * ICO since in unix time (must be bigger than pre-ico till): 
 * ICO till in unix time:
 * ICO min sold tokens (i.e. 30000 tokens: 30000000000000000000000 



3. Changes to the ICO can be made. If date needs to be changed there is function "Set period", for setting the price "Set Token price". It's also possible to minimum and maximum contribution for each phase, change multivest address, lock contract and other less significat functions are possible.

Pre-ICO phase has id 0 and ICO phase has id 1.