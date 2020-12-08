from argparse import ArgumentParser

parser = ArgumentParser(description='Airflow Fargate Example')
parser.add_argument('number', help='number', type=int)

if __name__ == '__main__':
    args = parser.parse_args()
    number = args.number
    
    print("Printing Even numbers in given range")
    f = open("/shared-volume/even.txt", "a")
    for i in range(int(number)):
        if(i % 2 == 0):
            f.write(str(i))
            print(i)
    f.close()
