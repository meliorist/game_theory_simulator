I've always wanted to conduct a classroom exercise to demonstrate the 2/3 game, but keeping track of the guesses in real time seemed like a non-starter.

Using nodejs and socket.io, I created a UI for the teacher that keeps track of the students' guesses, and a student interface for entering their guess. The student interface also provides realtime feedback as well as results after each round.

How to use it

First, the teacher loads the teacher UI at /teacher. This creates a room ID at random. (Still hardcoded at the moment to H1234) The teacher then provides the room ID to the students.

The student load /student. Each student enters their name, then the room number provided by the teacher, and then, when instructed by the teacher, enters their guess.

Once everyone has entered their guess, the teacher can reveal the winner to the class.

You want to be able to demonstrate how the group dynamic tends to equalibrium, so the teacher can manage multiple rounds with the same group.

When the teacher reveals the winner, another column is added to the table for the next round. The teacher can the re-enable the students' entry fields to allow them to enter the next guess.

Following along with the principle illustrated by the 2/3 game, the glass will see which students can see where the game is going in terms of the equalibrium. Even once they understand that the perfectly rational answer is 0, the best answer requires an understanding of the "common knowledge of rationality of all the players." (Wikipedia)

To do:
Add a function on the Teacher UI to start a new round:
* Re-enable the student's entry
* Clear the total
* Save the data
* Add a new column to the table
* Reset the plot array

Figure out who the winner is
Elaborate on the message about the winner when broadcast

Add the student count to redis database
Track each student's guess in redis

Add min and max to teacher UI

Add data validation for the student's entry (between 0 and 100)
Add updates for number of students entering guesses in the student's UI so they can track progress

Add updates if a student drops out of the room

Add feature to student UI to reset based on cookie (so they can't reload the page)

The code in this project is based on the examples from a class on lynda.com called Building Complex Express Sites with Redis and Socket.IO.