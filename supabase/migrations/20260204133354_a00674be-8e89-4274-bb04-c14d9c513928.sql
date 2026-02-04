-- 1. Drop old unique constraint
ALTER TABLE giftbit_brands 
DROP CONSTRAINT IF EXISTS giftbit_brands_brand_code_environment_key;

-- 2. Add new unique constraint with region_code
ALTER TABLE giftbit_brands 
ADD CONSTRAINT giftbit_brands_brand_code_region_environment_key 
UNIQUE (brand_code, region_code, environment);

-- 3. Clear existing incorrectly-synced data to resync
DELETE FROM giftbit_brands WHERE environment = 'testbed';