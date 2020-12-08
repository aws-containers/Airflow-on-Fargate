from argparse import ArgumentParser
import os

parser = ArgumentParser(description='Airflow Fargate Example')
parser.add_argument('number', help='number', type=int)

def delete_file(file_path):
    try:
        os.remove(file_path)
        print("Successfully deleted file: " + file_path)
    except OSError:
        print("File not found: " + file_path)
        pass


if __name__ == '__main__':
    args = parser.parse_args()
    number = args.number
    print("Printing all numbers in given range")
    f_numbers = open("/shared-volume/numbers.txt", "a")

    # Copy from even.txt to numbers.txt
    f_even = open("/shared-volume/even.txt", "r")
    for line in f_even:
        f_numbers.write(line)
    f_even.close()

    # Copy from odd.txt to numbers.txt
    f_odd = open("/shared-volume/odd.txt", "r")
    for line in f_odd:
        f_numbers.write(line)
    f_odd.close()

    f_numbers.close()

    # Print contents of numbers.txt
    f_numbers = open("/shared-volume/numbers.txt", "r")
    for line in f_numbers:
        print(line)
        print("\n")
    f_numbers.close()

    # Deleting all files, to avoid EFS cost
    delete_file("/shared-volume/even.txt")
    delete_file("/shared-volume/odd.txt")
    delete_file("/shared-volume/numbers.txt")
    delete_file("/shared-volume/numbers.txt") # Will result in File not found message
