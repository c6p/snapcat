include "globals.mzn";

int: DIST;
int: DIST_SQ = DIST * DIST;
% --- Parameters ---
int: catCount;
int: Nrows;
int: Ncats;
int: ROW_SPACING;
int: X_MAX;

array[1..Ncats] of 3..7: width;
array[1..Ncats] of 1..5: color;
array[1..Ncats] of 1..4: pattern;
array[1..Ncats, 1..Ncats] of -8..8: contributions;

% --- Decision variables ---
array[1..catCount] of var 1..Ncats: cats;
array[1..catCount] of var 1..Nrows: row;
array[1..catCount] of var 0..X_MAX: x;

% --- Intermediate variables for clarity and propagation ---
array[1..catCount] of var 3..7: placed_width = [width[cats[i]] | i in 1..catCount];
array[1..Ncats] of bool: is_black = [color[i] == 1 /\ pattern[i] == 1 | i in 1..Ncats];
array[1..catCount] of var bool: placed_is_black = [is_black[cats[i]] | i in 1..catCount];

constraint alldifferent(cats);

constraint forall(i in 1..catCount) (x[i] + placed_width[i] <= X_MAX); %- (Nrows - row[i]));

% --- OPTIMIZATION 1: Use the diffn global constraint for non-overlap ---
% This provides much stronger propagation than the pairwise constraint.
% We model each cat as a 2D rectangle. The "height" in the row dimension is 1.
array[1..catCount] of var int: y = [(row[i] - 1) * ROW_SPACING | i in 1..catCount];
array[1..catCount] of var int: w = placed_width;
array[1..catCount] of int: h = [ROW_SPACING | _ in 1..catCount]; % Height of each box
% Note: The diffn constraint considers boxes touching at the boundary as overlapping.
% This is equivalent to the original model's "<=".
include "diffn.mzn";
constraint diffn(x, y, w, h);


% --- OPTIMIZATION 2: Symmetry Breaking ---
% Break symmetry on the `cats` variable for cats with identical properties.
% This can be complex to model dynamically, but a simpler lexicographical ordering
% on the `cats` array can still help significantly.
%constraint increasing(cats);
%constraint increasing([cats[i] | i in 1..catCount]);


% --- Distance, Mood, and Level Calculations (kept similar) ---
% Introducing intermediate variables for distance components
%array[1..catCount, 1..catCount] of var bool: contained;
array[1..catCount, 1..catCount] of var int: x_dist;
array[1..catCount, 1..catCount] of var int: y_dist;
array[1..catCount, 1..catCount] of var int: dist_sq;

constraint forall(i,j in 1..catCount where i < j)(
  let {
    var int: w_i = placed_width[i];
    var int: w_j = placed_width[j];
  } in
  % Absolute difference in x, accounting for width
  %contained[i,j] = (x[i] <= x[j] /\ x[j] + w_j <= x[i] + w_i \/ x[j] <= x[i] /\ x[i] + w_i <= x[j] + w_j) /\
  %contained[j,i] = (x[j] <= x[i] /\ x[i] + w_i <= x[j] + w_j \/ x[i] <= x[j] /\ x[j] + w_j <= x[i] + w_i) /\
  x_dist[i,j] = max(0, if x[i] > x[j] then x[i] - (x[j] + w_j) else x[j] - (x[i] + w_i) endif) /\
  % Absolute difference in y
  % ROW_SPACING * (if row[i] > row[j] then row[i] - row[j] else row[j] - row[i] endif)
  y_dist[i,j] = abs(y[i] - y[j]) /\
  %y_dist[i,j] = if contained[i,j] /\ y_dist[i,j] == ROW_SPACING then 0 else y_dist[i,j] endif /\
  dist_sq[i,j] = if x_dist[i,j] > DIST \/ y_dist[i,j] > DIST then DIST_SQ else sqrt(x_dist[i,j]*x_dist[i,j] + y_dist[i,j]*y_dist[i,j]) endif /\
  % Symmetrize the matrices
  x_dist[j,i] = x_dist[i,j] /\
  y_dist[j,i] = y_dist[i,j] /\ % if contained[j,i] /\ y_dist[i,j] == ROW_SPACING then 0 else y_dist[i,j] endif
  dist_sq[j,i] = dist_sq[i,j] % x_dist[i,j]*x_dist[i,j] + y_dist[i,j]*y_dist[i,j]
);
% Handle the self-distances
constraint forall(i in 1..catCount)(dist_sq[i,i] = 0);


array[1..catCount] of var int: mood_score =
  [ sum(j in 1..catCount) (contributions[cats[i],cats[j]] * max(0, DIST - dist_sq[i,j])) | i in 1..catCount ];

array[1..Ncats] of var 1..5: level;
% Reverting to the function, as the bidirectional constraint was slow for Gecode
function var 1..5: mood_level(var int: ms, int: offset) =
  if ms <= (-13+offset)*DIST then 1
  elseif ms <= (-6+offset)*DIST then 2
  elseif ms <= (6+offset)*DIST then 3
  elseif ms <= (13+offset)*DIST then 4
  else 5 endif;
constraint forall(i in 1..catCount) (level[cats[i]] = mood_level(mood_score[i], 0));

constraint exists(i in 1..catCount) (placed_is_black[i]);

% --- Objectives ---
int: Nrules;              % The number of prioritized objectives

% rule_matches[j, i] is true if item 'i' matches the filter for rule 'j'
array[1..Nrules, 1..Ncats] of bool: rule_matches;

% Define operators as integers (1: '=', 2: '>=', 3: '<=')
enum OPERATOR = { EQ, GE, LE, GT, LT, NO };
array[1..Nrules] of OPERATOR: rule_operators;
array[1..Nrules] of int: rule_levels;


% --- Constraint ---
constraint forall(j in 1..Nrules) (exists(i in cats) (rule_matches[j, i]));

% For each item, find the FIRST rule that matches and apply its constraint.
constraint if Nrules > 0 then forall(i in 1..Ncats) (
  (i in cats) -> (
    forall(j in 1..Nrules where rule_matches[j, i]) (
      let {
        OPERATOR: op = rule_operators[j];
        int: lvl = rule_levels[j];
      } in
        if op == EQ then level[i] = lvl
        elseif op == GE then level[i] >= lvl
        elseif op == LE then level[i] <= lvl
        elseif op == GT then level[i] > lvl
        elseif op == LT then level[i] < lvl
        else true
        endif
    )
  )
) endif;

%constraint forall(i in 1..catCount where placed_is_black[i])( level[cats[i]] = 5 );
%constraint forall(i in 1..catCount)( level[cats[i]] >= 3 );
%constraint forall(i in 1..catCount where pattern[cats[i]] < 3)( level[i] >= 3 );
%constraint exists(i in 1..catCount) (pattern[cats[i]] >= 3);
%constraint forall(i in 1..catCount where pattern[cats[i]] >= 3)( level[i] = 1 );


% --- OPTIMIZATION 3: Refined Search Strategy ---
solve
% Prioritize the fundamental choice of which cats are present.
% 'impact' is a powerful learning heuristic that often works well.
:: int_search(cats, impact, indomain_random)
%:: int_search(cats, first_fail, indomain_min)
% Then decide placement.
:: int_search(row, impact, indomain_random)
:: int_search(x, dom_w_deg, indomain_median)
satisfy;

% --- Output ---
output [
  "Cat \(cats[i]): color=\(color[cats[i]]) pat=\(pattern[cats[i]]) row=\(row[i]) x=\(x[i]) mood=\(mood_score[i]/DIST) level=\(level[cats[i]])\n"
  | i in 1..catCount
];