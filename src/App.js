import React, { useEffect, useRef, useState } from 'react';
import {
  ChakraProvider,
  Box,
  Text,
  theme,
  Button,
  Flex,
  Select,
  Divider,
  Grid,
  GridItem,
} from '@chakra-ui/react';
import WebFont from 'webfontloader';
import matrix from 'matrix-js';

const roundTime = 100;

function App() {
  const [gameActive, _setGameActive] = useState(false);
  const [activeGameInfo, setActiveGameInfo] = useState(null);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(
    +localStorage.getItem('high-score') || 0
  );
  const [showGameOver, setShowGameOver] = useState(false);
  const timer = useRef(null);

  const increaseScore = () => {
    const newScore = score + 1;
    setScore(newScore);
    document.getElementById('score').textContent = score;

    if (newScore > highScore) {
      setHighScore(newScore);
      localStorage.setItem('high-score', newScore);
    }
  };

  const splitToChunks = (array, parts) => {
    let result = [];
    for (let i = parts; i > 0; i--) {
      result.push(array.splice(0, Math.ceil(array.length / i)));
    }
    return result;
  };

  const submitAnswer = () => {
    const {
      dimension: dim,
      m1,
      m2,
      operation,
      resultType,
      hasSecondMatrix,
    } = activeGameInfo;
    const inputNum = dim * dim;

    let inputs = [];

    if (resultType === 'matrix') {
      inputs = Array.apply(null, { length: inputNum }).map((x, i) => {
        return document.getElementById(`input-${i}`);
      });
    } else {
      const el = document.getElementById(`input-single`);
      inputs = [el];
    }

    const inputValues = inputs.map((x, i) => {
      const elText = x.value;
      if (elText.length === 0) return null;
      return +elText;
    });

    inputs.map(el => (el.value = ''));

    const hasCorrectInputs = inputValues.every(val => val !== null);
    if (!hasCorrectInputs) return gameOver();

    const m3 = splitToChunks([...inputValues], dim);

    let correctResult = [];
    const m1Matrix = matrix(m1);
    const m2Matrix = hasSecondMatrix ? matrix(m2) : null;
    const m3Matrix = resultType === 'matrix' ? matrix(m3) : null;

    switch (operation) {
      case '+':
        correctResult = m1Matrix.add(m2Matrix);
        break;
      case '-':
        correctResult = m1Matrix.sub(m2Matrix);
        break;
      case 'x':
        correctResult = m1Matrix.prod(m2Matrix);
        break;
      case 'Transpose':
        correctResult = m1Matrix.trans();
        break;
      case 'Determinant':
        correctResult = m1Matrix.det();
        break;
      default:
        correctResult = m1Matrix.add(m2Matrix);
    }

    const isValid =
      resultType === 'matrix'
        ? matrix(correctResult).equals(m3Matrix)
        : correctResult === inputValues[0];

    if (!isValid) {
      return gameOver();
    }

    increaseScore();
    startRound(dim);
  };

  const setGameActive = state => {
    clearInterval(timer.current);
    _setGameActive(state);
    if (!state) {
      setActiveGameInfo(null);
    }
  };
  useEffect(() => {
    WebFont.load({
      google: {
        families: ['Orbitron'],
      },
    });
  }, []);
  const endGame = () => {
    setScore(0);
    setGameActive(false);
  };
  const gameOver = () => {
    endGame();
    setShowGameOver(true);
  };

  const generateRandomMatrix = dimension => {
    return Array.apply(null, { length: dimension }).map(() =>
      Array.apply(null, { length: dimension }).map(() =>
        Math.floor(Math.random() * 11)
      )
    );
  };

  const startRound = dimension => {
    const operations = ['+', '-', 'x', 'Transpose', 'Determinant'];
    const operation = operations[Math.floor(Math.random() * operations.length)];
    const hasSecondMatrix =
      operation !== 'Transpose' && operation !== 'Determinant';
    const m1 = generateRandomMatrix(dimension);
    const m2 = hasSecondMatrix ? generateRandomMatrix(dimension) : null;
    setActiveGameInfo(prev => ({
      ...prev,
      operation,
      m1,
      m2,
      hasSecondMatrix,
      resultType: operation === 'Determinant' ? 'single' : 'matrix',
    }));
    const timerEl = document.getElementById('time-left');
    if (timerEl) {
      timerEl.textContent = roundTime;
    }
  };

  const onStartPressed = () => {
    const e = document.getElementById('dropdown');
    const dimension = e.options[e.selectedIndex].value;
    setShowGameOver(false);
    setActiveGameInfo({ dimension });
    setGameActive(true);

    clearInterval(timer.current);
    timer.current = setInterval(() => {
      const cur = +document.getElementById('time-left').textContent;
      if (cur === 0) {
        gameOver();
        clearInterval(timer.current);
        return;
      }
      document.getElementById('time-left').textContent = cur - 1;
    }, 1000);

    startRound(dimension);
  };

  const renderMatrix = m => {
    const dimension = m.length;
    const mArray = m.flat(2);
    return (
      <Flex alignItems={'center'}>
        <Text fontSize={'100px'} color="white" fontFamily="Orbitron">
          |
        </Text>
        <Grid
          templateColumns={`repeat(${dimension}, ${dimension}fr)`}
          gap={3}
          height={20}
          alignSelf="center"
        >
          {mArray.map((x, i) => {
            return (
              <GridItem
                key={i}
                lineHeight={0}
                height={'0'}
                padding={0}
                alignSelf="center"
              >
                <Text color="white" fontFamily="Orbitron" fontSize={'md'}>
                  {x}
                </Text>
              </GridItem>
            );
          })}
        </Grid>
        <Text fontSize={'100px'} color="white" fontFamily="Orbitron">
          |
        </Text>
      </Flex>
    );
  };

  const renderEmptyMatrix = dimension => {
    return (
      <Flex alignItems={'center'}>
        <Text fontSize={'100px'} color="white" fontFamily="Orbitron">
          |
        </Text>
        <Grid
          templateColumns={`repeat(${dimension}, ${dimension}fr)`}
          gap={3}
          height={20}
          alignSelf="center"
        >
          {Array.apply(null, { length: dimension * dimension }).map((x, i) => {
            return (
              <GridItem lineHeight={0} height={'0'} padding={0} key={i}>
                <input
                  id={`input-${i}`}
                  style={{
                    padding: '5px',
                    width: '35px',
                    height: '25px',
                    fontFamily: 'Orbitron',
                    backgroundColor: 'rgba(255,255,255,0)',
                    borderWidth: 1,
                    borderColor: 'rgba(255,255,255,0.3)',
                    borderRadius: 3,
                    caretColor: 'white',
                    color: 'white',
                    fontSize: '15px',
                  }}
                  type="number"
                  min="1"
                  max="999"
                />
              </GridItem>
            );
          })}
        </Grid>
        <Text fontSize={'100px'} color="white" fontFamily="Orbitron">
          |
        </Text>
      </Flex>
    );
  };

  return (
    <ChakraProvider theme={theme}>
      <Box
        textAlign="center"
        fontSize="xl"
        height={'100vh'}
        alignItems={'center'}
        justifyContent={'center'}
        flexDirection="column"
        display={'flex'}
        bgImage={
          'https://images-wixmp-ed30a86b8c4ca887773594c2.wixmp.com/f/b0b7c577-941a-496d-a656-32c5732d82ff/d6h0i32-15f2929e-0015-44de-a2c9-59d30e2923f8.gif?token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ1cm46YXBwOjdlMGQxODg5ODIyNjQzNzNhNWYwZDQxNWVhMGQyNmUwIiwiaXNzIjoidXJuOmFwcDo3ZTBkMTg4OTgyMjY0MzczYTVmMGQ0MTVlYTBkMjZlMCIsIm9iaiI6W1t7InBhdGgiOiJcL2ZcL2IwYjdjNTc3LTk0MWEtNDk2ZC1hNjU2LTMyYzU3MzJkODJmZlwvZDZoMGkzMi0xNWYyOTI5ZS0wMDE1LTQ0ZGUtYTJjOS01OWQzMGUyOTIzZjguZ2lmIn1dXSwiYXVkIjpbInVybjpzZXJ2aWNlOmZpbGUuZG93bmxvYWQiXX0.agQ9DxpNax_MUrk9IOIybBjYCzcQURmH4-M-nC2ZNCk'
        }
      >
        {showGameOver && (
          <Box
            width={'240px'}
            height={'50px'}
            borderWidth="2px"
            borderColor={'red'}
            borderRadius="lg"
            display={'flex'}
            alignItems={'center'}
            justifyContent={'center'}
            marginBottom={'20px'}
          >
            <Text
              fontSize={'lg'}
              color={'red'}
              fontFamily={'Orbitron'}
              fontWeight="bold"
            >
              GAME OVER
            </Text>
          </Box>
        )}
        <Box
          width={'80%'}
          maxW={'500px'}
          height={'400px'}
          borderWidth="2px"
          borderRadius="lg"
          backgroundColor={'rgba(0,0,0,0.85)'}
          borderColor="rgba(255,255,255,0.1)"
          padding={'20px'}
          display="flex"
          flexDirection={'column'}
          alignItems={'center'}
          justifyContent={!gameActive ? 'space-evenly' : 'space-between'}
        >
          {gameActive ? (
            <>
              <Box
                width={'100%'}
                height={'20px'}
                display="flex"
                justifyContent={'space-between'}
              >
                <Text fontSize={'sm'} color={'white'} fontFamily={'Orbitron'}>
                  Round time left: <span id="time-left">{roundTime}</span>
                </Text>
                <Text fontSize={'sm'} color={'white'} fontFamily={'Orbitron'}>
                  Score: <span id="score">{score}</span>
                </Text>
              </Box>
              <Flex alignItems={'center'} flexDirection="column">
                <Flex alignItems={'center'}>
                  {!activeGameInfo?.hasSecondMatrix && (
                    <Text
                      fontSize={'lg'}
                      fontWeight={'bold'}
                      color={'white'}
                      fontFamily={'Orbitron'}
                      marginRight={'10px'}
                    >
                      {activeGameInfo.operation}:
                    </Text>
                  )}
                  {renderMatrix(activeGameInfo.m1)}
                  {activeGameInfo?.hasSecondMatrix && (
                    <>
                      <Text fontSize={'30px'} color="white">
                        {activeGameInfo?.operation}
                      </Text>
                      {renderMatrix(activeGameInfo.m2)}
                    </>
                  )}
                </Flex>

                <Flex alignItems={'center'}>
                  <Text fontSize={'30px'} color="white">
                    =
                  </Text>
                  {activeGameInfo.resultType === 'matrix' ? (
                    renderEmptyMatrix(activeGameInfo.dimension)
                  ) : (
                    <input
                      id={`input-single`}
                      style={{
                        marginLeft: '10px',
                        padding: '5px',
                        width: '35px',
                        height: '25px',
                        fontFamily: 'Orbitron',
                        backgroundColor: 'rgba(255,255,255,0)',
                        borderWidth: 1,
                        borderColor: 'rgba(255,255,255,0.3)',
                        borderRadius: 3,
                        caretColor: 'white',
                        color: 'white',
                        fontSize: '15px',
                      }}
                      type="number"
                      min="1"
                      max="999"
                    />
                  )}
                </Flex>
              </Flex>
              <Flex justifyContent={'space-between'} width="100%">
                <Button
                  _hover={{
                    backgroundColor: null,
                  }}
                  _active={{
                    backgroundColor: null,
                  }}
                  variant="outline"
                  color="red"
                  size={'sm'}
                  borderColor={'red'}
                  onClick={endGame}
                >
                  End game
                </Button>
                <Button
                  _hover={{
                    backgroundColor: null,
                  }}
                  _active={{
                    backgroundColor: null,
                  }}
                  variant="outline"
                  color="#008F11"
                  size={'sm'}
                  borderColor={'#008F11'}
                  onClick={() => submitAnswer()}
                >
                  Submit
                </Button>
              </Flex>
            </>
          ) : (
            <>
              <Text fontSize="3xl" color={'white'} fontFamily={'Orbitron'}>
                Welcome back
              </Text>
              <Button
                onClick={onStartPressed}
                colorScheme="teal"
                variant="solid"
                width={'80%'}
                fontFamily={'Orbitron'}
                _hover={{
                  backgroundColor: '#008F11',
                }}
                _active={{
                  backgroundColor: null,
                }}
                backgroundColor="#008F11"
              >
                Start Game
              </Button>
              <Divider
                orientation="horizontal"
                margin={'30px'}
                width={'50%'}
                backgroundColor={'rgba(255,255,255,.2)'}
              />
              <Flex justifyContent={'space-between'}>
                <Text
                  fontSize="md"
                  color={'white'}
                  fontFamily={'Orbitron'}
                  marginRight="50px"
                >
                  Highscore: {highScore}
                </Text>

                <Select color="white" fontFamily={'Orbitron'} id="dropdown">
                  <option value="2">Easy</option>
                  <option value="3">Intermediate</option>
                  <option value="4">Pro</option>
                </Select>
              </Flex>
            </>
          )}
        </Box>
      </Box>

      <div
        style={{ position: 'absolute', marginTop: '-30px', marginLeft: '10px' }}
      >
        <Text fontSize="md" color={'white'} fontFamily={'Orbitron'}>
          Built by Ryan Castriotta
        </Text>
      </div>
    </ChakraProvider>
  );
}

export default App;
