
















/*
our tables do everthing with just a small handful of postgres types,
and our conventions for column titles identify what kind of data columns have:

example2_table            table names end _table, lowercase and numerals ok

row_tag         CHAR(21)  a globally unique tag to identify this row
row_tick        BIGNUM    set when we added the row
hide            BIGNUM    0 to start, nonzero to ignore this row in regular use
                          ^ most tables start with these three columns

password_hash   CHAR(52)  52 characters of a sha256 hash value encoded to base32
user_name_text  TEXT      text which can be blank or long

_tag, _hash, and _text are strings; everything else must be an integer
a column which can be a tag or blank is _text
as is a column which can be text or numerals, like settings_table

PRIMARY KEY is frequently row_tag, which is guaranteed to have unique tags,
even though we never query on it
every column is NOT NULL to make things simpler, generally and for .upsert()
*/

to this add:
using indices, and multicolumn indices, to match common queries and makek them fast
not using foreign keys, which aren't for performance, and are instead to check adds and deletes between tables


```
oh, also, you need a table that has environment clues
links together time, browser tags, ip addresses, geolocation information, and 
this one is interesting because it'll need to coalesce similar rows, like if it's all the same in the last hour, it doesn't add, or something
you could actually write taht right now, separate of user entirely

hmm, maybe code that one first

you need user tag because otherwise you could leak to that user other things that happened on the same browser
```


/*
you need to figure out how to see which indices exist
and create indices that match common queries
like, probably, filter on hide 0, a given tag, and then sort by tick descending
that's probably the vanilla index
*/

/*
-- records of browsers signing in with password and signing out
CREATE TABLE access_table (
	row_tag      CHAR(21)  PRIMARY KEY  NOT NULL, -- row tag
	row_tick     BIGINT                 NOT NULL, -- when inserted
	browser_tag  CHAR(21)               NOT NULL, -- browser tag
	signed_in    BIGINT                 NOT NULL  -- 0 signed out or 1 signed in
);
-- composite index to make a filtering by browser tag and sorting by tick fast
CREATE INDEX access_index_on_browser_tick ON access_table (browser_tag, row_tick);
*/





/*
simple and powerful design goals:
1 high level functions that are operation, but not table, specific
2 schema object that identifies database and table, alongside commented create command for table and index
3 column titles that indicate type
and these last two are how the function validates data going into a table
*/









/*
facts about postgres and choices about how we're using it:
we're using BIGINT for every integer, for simplicity, even if we only plan on storing 0 or 1
indices make queries much faster, and compound indices that match queries are a good idea
*/



































//and then the idea here is, you keep on adding generalized functions, even if each is quite specific to a new type of query you want to do

/*
how do you write fast little tests of these that really hit the database?
your manual testing has been slow and tedious
*/














/*
this sitting goal: get all current database use factored through generalized functions
then tonight you can go on a notes and previous scraps deleteathon
*/

//these are the database functions in use; next, use the generalized functions above to refactor these away

//proposed

//bookmark january, next, use these in account.js, account2.js, and message.js, and then delete the remaining query_





































