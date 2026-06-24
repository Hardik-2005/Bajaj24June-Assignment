import React from 'react';

/**
 * Renders a tree node and its children recursively as an indented text-based tree view.
 * treeObj is an object like { A: { B: { D: {} }, C: {} } }
 * We start from the root key.
 */
function TreeLines({ obj, prefix = '', isLast = true }) {
  const entries = Object.entries(obj);
  return (
    <>
      {entries.map(([node, children], idx) => {
        const isLastChild = idx === entries.length - 1;
        const connector = isLast && idx === 0
          ? ''    // root node - no connector
          : isLastChild ? '└─ ' : '├─ ';
        const childPrefix = isLastChild ? prefix + '   ' : prefix + '│  ';
        const hasChildren = Object.keys(children).length > 0;

        return (
          <React.Fragment key={node}>
            <div className="tree-node-row">
              <span className="tree-connector">{prefix}{connector}</span>
              <span className={`tree-node-label ${hasChildren ? '' : 'leaf'}`}>
                {node}
              </span>
            </div>
            {hasChildren && (
              <TreeLines obj={children} prefix={childPrefix} isLast={isLastChild} />
            )}
          </React.Fragment>
        );
      })}
    </>
  );
}

export default function TreeCard({ hierarchy }) {
  const { root, tree, depth, has_cycle } = hierarchy;
  const isCyclic = !!has_cycle;

  return (
    <div className={`tree-card ${isCyclic ? 'cyclic' : ''}`}>
      <div className="tree-card-header">
        <div className="tree-root-badge">
          <div className={`root-icon ${isCyclic ? 'cyclic' : 'normal'}`}>
            {root}
          </div>
          <div>
            <h3>Root: {root}</h3>
            <div className="tree-meta">
              {isCyclic ? 'Cyclic group' : `${depth} level${depth !== 1 ? 's' : ''} deep`}
            </div>
          </div>
        </div>
        {isCyclic ? (
          <span className="badge-cycle">⟳ Cycle</span>
        ) : (
          <span className="badge-depth">↕ Depth {depth}</span>
        )}
      </div>

      <div className="tree-body">
        {isCyclic ? (
          <div className="cycle-placeholder">
            <span className="cycle-icon">🔄</span>
            <div>
              <strong>Cycle detected</strong>
              <div style={{ marginTop: 4, fontSize: '0.8rem', opacity: 0.7 }}>
                This group of nodes forms a circular dependency and cannot be represented as a tree.
              </div>
            </div>
          </div>
        ) : (
          <div className="tree-view">
            <TreeLines obj={tree} prefix="" isLast={true} />
          </div>
        )}
      </div>
    </div>
  );
}
