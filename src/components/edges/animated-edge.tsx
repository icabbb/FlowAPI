'use client';

import { useMemo } from 'react';
import { BaseEdge, EdgeProps, getBezierPath, EdgeLabelRenderer } from '@xyflow/react';

interface AnimatedEdgeData {
  label?: string;
  status?: 'success' | 'error' | 'loading' | 'idle';
  [key: string]: any;
}

export function AnimatedEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
  data,
  interactionWidth = 20,
}: EdgeProps) {
  const gradientId = useMemo(() => `edge-gradient-${id}`, [id]);

  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const edgeData = data as AnimatedEdgeData | undefined;
  const status = edgeData?.status || 'idle';
  const statusClass = status !== 'idle' ? `status-${status}` : '';

  const edgeStyle = {
    ...style,
    strokeDasharray: '5',
  };

  return (
    <>
      <defs>
        <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#0ea5e9" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#14b8a6" stopOpacity="0.8" />
        </linearGradient>
      </defs>
      
      <BaseEdge 
        path={edgePath} 
        id={id} 
        style={{
          ...edgeStyle,
          stroke: `url(#${gradientId})`,
        }}
        className={`animated-edge ${statusClass}`}
        markerEnd={markerEnd}
        interactionWidth={interactionWidth}
      />
      
      {edgeData?.label && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              pointerEvents: 'all',
              background: 'rgba(15, 23, 42, 0.75)',
              padding: '3px 6px',
              borderRadius: '3px',
              fontSize: 11,
              fontWeight: 500,
              color: 'white',
              border: '1px solid rgba(100, 116, 139, 0.5)',
              backdropFilter: 'blur(4px)',
            }}
            className="nodrag nopan"
          >
            {edgeData.label}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
}

export default AnimatedEdge; 