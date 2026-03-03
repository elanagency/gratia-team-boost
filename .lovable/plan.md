

## Add Datafast Analytics Script

Add the Datafast analytics tracking script to `index.html` in the `<head>` section, alongside the existing Apollo and Marker.io scripts.

### Change — `index.html`
Add the following script tag in the `<head>`, after the Apollo tracking script block:

```html
<script
  defer
  data-website-id="dfid_fzdkTEEHu12hltS9HNa4V"
  data-domain="grattia.com"
  src="https://datafa.st/js/script.js">
</script>
```

