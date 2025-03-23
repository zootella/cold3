




/*
ttd february
refactor turnstile into here
this means you probably don't need defineExpose, which works but is not prominently documented in a worrysome way
and, you can be sure that you're only doing one turnstile per tab at a time
*/



/*
ttd march
before you change around turnstile, here's how it's working now
you did this design before you found out about stores
and before you did PostButton and learned about parent and child component communication








actually, maybe turnstile should be in TurnstileButton and not in a store
because even though you should only have one turnstile button on the page
imagine somehow you had two
if it's in a store, you think they will collide with one another
but in the button, you'll have two of them, and they should stay separate
that might totally not work according to how turnstile works or what turnstile expects, of course
but it also may, as that sort of error could come up and cloudflare may have coded turnstile imagining it


*/













