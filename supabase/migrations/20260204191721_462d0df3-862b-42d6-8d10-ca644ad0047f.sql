-- Clean up incorrectly synced testbed brands (they were synced before the region filter fix)
DELETE FROM giftbit_brands WHERE environment = 'testbed';