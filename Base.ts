import Grid = module('Grid');

export interface Map
{
    grid:Grid.Grid;
    parent:HTMLElement;
    redraw():void;
}
