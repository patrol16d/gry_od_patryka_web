import React, { ReactNode, useEffect, useRef, useState } from 'react';
import { Field } from '../models/field';

interface InfiniteLoopingListProps {
    items: Field[];
    generateField: (field: Field, index: number) => ReactNode;
    generetePlayerBox: (playerName: string) => ReactNode;
    genereteButtons: () => ReactNode;
}

type playerBoxesType = { top: string[], bottom: string[], none: string[] };

const InfiniteLoopingList: React.FC<InfiniteLoopingListProps> = ({
    items,
    generateField,
    generetePlayerBox,
    genereteButtons,
}) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const scrollRef = useRef<HTMLDivElement>(null);
    const [playerBoxes, setPlayerBoxes] = useState<playerBoxesType>({
        top: [],
        bottom: [],
        none: [],
    });


    const playersPos: { [player: string]: number } = {};

    useEffect(() => {
        const container = containerRef.current;
        const scrollContent = scrollRef.current;

        if (!(container && scrollContent)) return;

        const contentHeight = scrollContent.scrollHeight;
        const containerHeight = container.clientHeight;

        if (contentHeight <= containerHeight) return;

        let currentHeight = 0;

        for (let i = 0; i < items.length; i++) {
            currentHeight += scrollContent.children[i].clientHeight / 3 * 2 + 12;

            items[i].players.forEach(player => {
                playersPos[player] = currentHeight;
            });

            currentHeight += scrollContent.children[i].clientHeight / 3;
        }

        const updatePlayerBoxes = () => {
            const boxes: { [player: string]: 'top' | 'bottom' | 'none' } = {};
            const newPlayerBoxes: playerBoxesType = {
                top: [],
                bottom: [],
                none: [],
            };

            let isSame = true;

            // console.clear();
            // console.debug(containerHeight, currentHeight / 3, containerHeight, container);

            Object.entries(playersPos).forEach(([name, pos]) => {
                const positions = [
                    pos - scrollContent.scrollTop,
                    pos - scrollContent.scrollTop + (contentHeight / 3),
                    pos - scrollContent.scrollTop + (contentHeight * 2 / 3)
                ];

                // const po = positions.map(p => Math.max(-p, p - containerHeight));

                const top = positions.filter(p => p < 0).map(p => -p);
                const none = positions.filter(p => p >= 0 && p <= containerHeight);
                const bottom = positions.filter(p => p > containerHeight).map(p => p - containerHeight);

                // console.debug(name);
                // console.debug(po);
                // console.debug(top);
                // console.debug(none);
                // console.debug(bottom);

                if (none.length > 0) {
                    boxes[name] = 'none';
                    newPlayerBoxes[boxes[name]].push(name);
                } else {
                    const topDist = top.pop() ?? contentHeight;
                    const bottomDist = bottom[0] ?? contentHeight;

                    boxes[name] = topDist < bottomDist ? 'top' : 'bottom';
                    newPlayerBoxes[boxes[name]].push(name);
                }

                isSame = isSame && (playerBoxes[boxes[name]].includes(name));
            });


            if (!isSame) {
                setPlayerBoxes(newPlayerBoxes);
            }
        }

        updatePlayerBoxes();

        const onScroll = () => {
            // console.log(contentHeight, scrollContent.scrollTop, scrollContent.scrollTop + containerHeight)

            if (scrollContent.scrollTop <= contentHeight / 6) {
                scrollContent.scrollTop += contentHeight / 3;
            }
            else if (scrollContent.scrollTop + containerHeight >= contentHeight / 6 * 5) {
                scrollContent.scrollTop -= contentHeight / 3 - containerHeight;
            }

            updatePlayerBoxes();
        };

        onScroll();

        scrollContent.addEventListener('scroll', onScroll);

        // Czyszczenie po odmontowaniu komponentu
        return () => {
            scrollContent.removeEventListener('scroll', onScroll);
        };
    }, [playerBoxes]);

    const duplicatedItems = [...items, ...items, ...items];

    return (
        <div ref={containerRef} style={{
            position: 'relative',
            padding: '10px',
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            flex: 1,
            overflow: 'hidden',
        }}>
            <div ref={scrollRef} style={{
                width: '100%',
                height: '100%',
                flex: 1,
                overflowY: 'scroll',
                scrollbarWidth: 'none',
            }}>
                {duplicatedItems.map((item, index) => (
                    generateField(item, index)
                ))}
            </div>

            {playerBoxes.top.length == 0 ? null :
                <div style={{
                    position: 'absolute',
                    right: 20,
                    top: 20,
                    backgroundColor: '#666',
                    borderRadius: 10,
                    padding: 5,
                    display: 'flex',
                    border: '1px solid #444',
                }}>
                    {playerBoxes.top.map(generetePlayerBox)}
                    <span style={{
                        marginTop: -6,
                        fontSize: 20,
                    }}>↑</span>
                </div>
            }

            {playerBoxes.bottom.length == 0 ? null :
                <div style={{
                    position: 'absolute',
                    right: 20,
                    bottom: 20,
                    backgroundColor: '#666',
                    borderRadius: 10,
                    padding: 5,
                    display: 'flex',
                    border: '1px solid #444',
                }}>
                    {playerBoxes.bottom.map(generetePlayerBox)}
                    <span style={{
                        marginTop: -4,
                        fontSize: 20,
                    }}>↓</span>
                </div>
            }

            <div style={{
                position: 'absolute',
                left: '50%',
                transform: 'translateX(-50%)',
                bottom: 30,
            }}>
                {genereteButtons()}
            </div>
        </div >
    );
};

export default InfiniteLoopingList;
