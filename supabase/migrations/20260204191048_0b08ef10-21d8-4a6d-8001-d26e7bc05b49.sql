-- Delete incorrectly synced AU brands (all global brands were mistakenly assigned to AU)
DELETE FROM giftbit_brands 
WHERE environment = 'production' 
AND region_code = 'AU';