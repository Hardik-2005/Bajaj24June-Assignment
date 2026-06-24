const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// ─── Hardcoded identity fields ────────────────────────────────────────────────
const IDENTITY = {
  user_id: "hardikgoyal_03082005",
  email_id: "hardik0680.be23@chitkara.edu.in",
  college_roll_number: "2310990680"
};

// ─── Validation ───────────────────────────────────────────────────────────────
/**
 * Validates a single entry. Returns true if it matches X->Y where X and Y are
 * each a single uppercase A-Z letter and X !== Y.
 */
function isValidEntry(entry) {
  if (typeof entry !== 'string') return false;
  const trimmed = entry.trim();
  // Must be exactly: single uppercase letter, ->, single uppercase letter
  const match = trimmed.match(/^([A-Z])->([A-Z])$/);
  if (!match) return false;
  const [, parent, child] = match;
  // Disallow self-loops
  if (parent === child) return false;
  return true;
}

// ─── Tree building helpers ────────────────────────────────────────────────────
/**
 * Builds a nested object tree from the adjacency list.
 * @param {string} node - current node
 * @param {Map<string, string[]>} adj - adjacency list
 * @param {Set<string>} visited - visited set (for cycle safety, though cycles are pre-checked)
 * @returns {Object}
 */
function buildTree(node, adj, visited = new Set()) {
  if (visited.has(node)) return {};
  visited.add(node);
  const children = adj.get(node) || [];
  const subtree = {};
  for (const child of children) {
    subtree[child] = buildTree(child, adj, visited);
  }
  return subtree;
}

/**
 * Calculates the depth of the tree rooted at `node`.
 * Depth = number of nodes on the longest root-to-leaf path.
 */
function calcDepth(node, adj, visited = new Set()) {
  if (visited.has(node)) return 0;
  visited.add(node);
  const children = adj.get(node) || [];
  if (children.length === 0) return 1;
  let maxChildDepth = 0;
  for (const child of children) {
    const d = calcDepth(child, adj, visited);
    if (d > maxChildDepth) maxChildDepth = d;
  }
  return 1 + maxChildDepth;
}

/**
 * DFS-based cycle detection.
 * Returns true if a cycle exists among nodes reachable from startNodes using adj.
 * Uses the standard WHITE/GRAY/BLACK coloring.
 */
function hasCycle(nodes, adj) {
  const color = {}; // 0=white, 1=gray, 2=black
  for (const n of nodes) color[n] = 0;

  function dfs(u) {
    color[u] = 1; // gray = in stack
    for (const v of (adj.get(u) || [])) {
      if (color[v] === 1) return true; // back edge → cycle
      if (color[v] === 0 && dfs(v)) return true;
    }
    color[u] = 2; // black = done
    return false;
  }

  for (const n of nodes) {
    if (color[n] === 0) {
      if (dfs(n)) return true;
    }
  }
  return false;
}

// ─── POST /bfhl ───────────────────────────────────────────────────────────────
app.post('/bfhl', (req, res) => {
  const { data } = req.body;

  if (!Array.isArray(data)) {
    return res.status(400).json({ error: 'data must be an array' });
  }

  // ── Step 1: Validate & separate invalid entries ────────────────────────────
  const validRaw = []; // trimmed valid entries
  const invalid_entries = [];

  for (const entry of data) {
    if (typeof entry === 'string' && isValidEntry(entry)) {
      validRaw.push(entry.trim());
    } else {
      invalid_entries.push(typeof entry === 'string' ? entry : String(entry));
    }
  }

  // ── Step 2: Deduplicate edges ──────────────────────────────────────────────
  const seenEdges = new Set();
  const duplicate_edges = [];
  const uniqueEdges = []; // [parent, child] pairs

  for (const entry of validRaw) {
    const [parent, child] = entry.split('->');
    const key = `${parent}->${child}`;
    if (seenEdges.has(key)) {
      // Only add one copy per unique duplicate pair
      if (!duplicate_edges.includes(key)) {
        duplicate_edges.push(key);
      }
    } else {
      seenEdges.add(key);
      uniqueEdges.push([parent, child]);
    }
  }

  // ── Step 3: Build adjacency list with multi-parent conflict resolution ──────
  // First parent edge wins for each child.
  const parentOf = new Map();    // child -> parent (first one wins)
  const adj = new Map();         // parent -> [children]
  const allNodes = new Set();

  for (const [parent, child] of uniqueEdges) {
    allNodes.add(parent);
    allNodes.add(child);

    if (parentOf.has(child)) {
      // Multi-parent conflict: discard subsequent parent edges silently
      continue;
    }
    parentOf.set(child, parent);

    if (!adj.has(parent)) adj.set(parent, []);
    adj.get(parent).push(child);
  }

  // ── Step 4: Find connected components (undirected) ─────────────────────────
  // We group nodes into connected components using Union-Find on the original
  // uniqueEdges (before multi-parent filtering), so all nodes in the same
  // "conceptual group" end up together.
  const uf = new Map();
  for (const n of allNodes) uf.set(n, n);

  function find(x) {
    if (uf.get(x) !== x) uf.set(x, find(uf.get(x)));
    return uf.get(x);
  }
  function union(a, b) {
    uf.set(find(a), find(b));
  }

  for (const [parent, child] of uniqueEdges) {
    union(parent, child);
  }

  // Group nodes by component root
  const components = new Map();
  for (const n of allNodes) {
    const root = find(n);
    if (!components.has(root)) components.set(root, []);
    components.get(root).push(n);
  }

  // ── Step 5: Process each component ────────────────────────────────────────
  const hierarchies = [];
  let total_trees = 0;
  let total_cycles = 0;
  let largest_tree_root = null;
  let largest_tree_depth = -1;

  for (const [, nodes] of components) {
    const nodeSet = new Set(nodes);

    // Determine natural roots: nodes in this component that have no parent
    const naturalRoots = nodes.filter(n => !parentOf.has(n)).sort();

    // Build a component-local adj that only contains edges within this component
    // (adj already only has valid deduplicated edges, but just be safe)
    const localAdj = new Map();
    for (const n of nodes) {
      if (adj.has(n)) {
        localAdj.set(n, adj.get(n).filter(c => nodeSet.has(c)));
      }
    }

    // Detect cycle in this component using DFS
    const cycleFound = hasCycle(nodes, localAdj);

    if (cycleFound) {
      // Cyclic group: pick the natural root or lexicographically smallest node
      const root = naturalRoots.length > 0 ? naturalRoots[0] : [...nodes].sort()[0];
      hierarchies.push({ root, tree: {}, has_cycle: true });
      total_cycles++;
    } else {
      // Non-cyclic: there may be multiple natural roots (forest in this component)
      // but with multi-parent conflict resolution and no cycles, each component
      // should ideally have one or more trees. Treat each natural root as its own tree.
      const roots = naturalRoots.length > 0 ? naturalRoots : [[...nodes].sort()[0]];
      for (const root of roots) {
        const treeObj = { [root]: buildTree(root, localAdj) };
        const depth = calcDepth(root, localAdj);
        hierarchies.push({ root, tree: treeObj, depth });
        total_trees++;

        if (
          depth > largest_tree_depth ||
          (depth === largest_tree_depth &&
            largest_tree_root !== null &&
            root < largest_tree_root)
        ) {
          largest_tree_depth = depth;
          largest_tree_root = root;
        }
      }
    }
  }

  // Sort hierarchies: non-cyclic trees first (by root), then cyclic groups
  // Actually the spec's example shows them in input order (A, X, P, G).
  // We'll sort by the smallest node in each component to approximate input order.
  hierarchies.sort((a, b) => a.root.localeCompare(b.root));

  const summary = {
    total_trees,
    total_cycles,
    largest_tree_root: largest_tree_root || null
  };

  return res.json({
    ...IDENTITY,
    hierarchies,
    invalid_entries,
    duplicate_edges,
    summary
  });
});

// ─── Health check ─────────────────────────────────────────────────────────────
app.get('/health', (req, res) => res.json({ status: 'ok' }));

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`BFHL backend running on port ${PORT}`));
