There are **n** students in a batch, numbered 1 to n. Nobody knows anybody at the start. Friendship is transitive for this problem: if a knows b and b knows c, then a, b and c are in the same **circle**.

Process **q** lines in order. Each is one of:

- `1 a b`: students a and b become friends.
- `2 a b`: a question. Are a and b in the same circle right now?

Print the answers to the questions as one string, with `Y` for yes and `N` for no, in the order the questions appear.
