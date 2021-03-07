# Instagram-Clone
Practice Interacting w/PostgreSqlDb from an api (only node not java)


Some Set up things of note:
- need to install postgreSQL on your computer (I used https://postgresapp.com/ ) + pgadmin ( https://www.pgadmin.org/ )

- create db tables using commands in " 7 - Instagram Clone - Stefan Grider Course.sql "

- populate db w/data from " backup-of-working-db.sql " ( not a file i created but one Stefan Grider provided in his PostgreSQL course) -> can do so by going to pgAdmin and right clicking db and selecting restore



The Reasoning behind Why I Created the Endpoints that I did: 
- the idea was to go screen by screen and see all the stuff that would require me to interact w/db (i.e. if user follows another user representing that somehow on db, if user goes to some user's profile page getting all the info we want to show from the db, etc.) 
- I tried to cover most everything but left out a couple things because I thought I got enough practice in writing queries - which was the main purpose of this activity. (example of Something I left out: supporting the ability to reply to a comment -> current schema doesn't support it because it doesn't relate comments to other comments) 


The Endpoints that I ended up creating:
Prior to looking at the screenshots I had already created endpoints for Getting updating deleting adding a new user
Screen 1: Registration page: user can register -> add row to 'users' table by inputting either phone or email (already did)
Screen 2: User's Profile page
- all info that gets shown -> (username , status, user avatar / profile pic, user bio, # posts followers following, photos of their posts, top 4 hashtags)
- possible actions that require interacting w/db -> when click # followers or following show list of all followers / following + user clicks follow button on other user's page
Screen 3: A Post Page
- data needed when on a post page -> username, photo / url, tags on photo, # likes, caption, all comments on a post, # likes on all those comments
- Possible actions that require interacting w/db ->  liking the post, liking a comment on the post, making a comment on the post
Miscellaneous / not on screens but still thought worth doing
- show all posts w/a certain hashtag after user searches according to hashtag (this is an actual instagram feature)
- top 100 users aja users w/most followers
- top 10 trending hashtags 
 
Work left to be done: 
- breaking up the routes to be in separate files according to what table in the db they interact w/(? didn't do it because I wasn't sure what to do w/things that interacted w/multiple tables)
- naming routes / endpoints according to proper naming convention (I didn't really learn that before)

